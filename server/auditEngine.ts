import Decimal from "decimal.js";

import type { AuditRequest, AuditResult, BillingCycle, PricingTier, PublicAuditView, ToolPricing, ToolRecommendation } from "./models.js";
import { PRICING_DATABASE, getToolPricing } from "./pricingData.js";

type TierChoice = { tier_name: string; price_monthly: number; price_annual: number | null; savings: number };

function roundMoney(value: Decimal.Value): number {
  return new Decimal(value).toDecimalPlaces(2).toNumber();
}

function roundPercent(value: Decimal.Value): number {
  return new Decimal(value).toDecimalPlaces(1).toNumber();
}

export function calculateMonthlyCost(monthlySpend: number, billingCycle: BillingCycle, annualSpend?: number | null): number {
  return billingCycle === "annual" && annualSpend !== null && annualSpend !== undefined ? roundMoney(new Decimal(annualSpend).dividedBy(12)) : roundMoney(monthlySpend);
}

export function calculateAnnualCost(monthlySpend: number, billingCycle: BillingCycle, annualSpend?: number | null): number {
  return billingCycle === "annual" && annualSpend !== null && annualSpend !== undefined ? roundMoney(annualSpend) : roundMoney(new Decimal(monthlySpend).times(12));
}

export function findMatchingTier(tool: ToolPricing, planName: string): PricingTier | undefined {
  const normalizedPlan = planName.trim().toLowerCase();
  return tool.tiers.find((tier) => normalizedPlan === tier.name.toLowerCase() || normalizedPlan.includes(tier.name.toLowerCase()));
}

function tierMonthlyTotal(tool: ToolPricing, tier: PricingTier, teamSize: number): number {
  return tool.pay_as_you_go ? 0 : roundMoney(new Decimal(tier.price_monthly).times(Math.max(teamSize, 1)));
}

export function findOptimalTier(toolId: string, currentPlan: string, currentMonthly: number, teamSize: number): TierChoice {
  const tool = getToolPricing(toolId);
  if (!tool) return { tier_name: currentPlan, price_monthly: currentMonthly, price_annual: null, savings: 0 };
  if (tool.pay_as_you_go) return { tier_name: "Pay-as-you-go", price_monthly: currentMonthly, price_annual: null, savings: 0 };
  const paidTiers = tool.tiers.filter((tier) => tier.price_monthly > 0);
  if (paidTiers.length === 0) return { tier_name: currentPlan, price_monthly: currentMonthly, price_annual: null, savings: 0 };
  const matchingTier = findMatchingTier(tool, currentPlan);
  if (matchingTier) {
    const expectedCurrent = tierMonthlyTotal(tool, matchingTier, teamSize);
    if (new Decimal(currentMonthly).lessThanOrEqualTo(new Decimal(expectedCurrent).times(1.1))) {
      return { tier_name: matchingTier.name, price_monthly: currentMonthly, price_annual: matchingTier.price_annual ?? null, savings: 0 };
    }
  }
  const bestTier = paidTiers.reduce((best, tier) => (tier.price_monthly < best.price_monthly ? tier : best), paidTiers[0]);
  const recommendedMonthly = tierMonthlyTotal(tool, bestTier, teamSize);
  const savings = Math.max(0, roundMoney(new Decimal(currentMonthly).minus(recommendedMonthly)));
  return { tier_name: bestTier.name, price_monthly: savings > 0 ? recommendedMonthly : currentMonthly, price_annual: bestTier.price_annual ?? null, savings };
}

export function findAlternativeTools(toolId: string): string[] {
  const tool = getToolPricing(toolId);
  if (!tool) return [];
  return PRICING_DATABASE.filter((candidate) => candidate.tool_id !== toolId && candidate.category === tool.category).slice(0, 3).map((candidate) => candidate.name);
}

function findFinanceFlags(toolId: string, currentPlan: string, teamSize: number): string[] {
  const flags: string[] = [];
  const normalizedPlan = currentPlan.toLowerCase();
  if (teamSize < 3 && (normalizedPlan.includes("enterprise") || normalizedPlan.includes("team") || normalizedPlan.includes("business") || normalizedPlan.includes("teams"))) {
    flags.push("Seat check: team size under 3 on a team or enterprise tier; review downgrade options before renewal.");
  }
  return flags;
}

export function generateFallbackSummary(recommendations: ToolRecommendation[]): string {
  const totalSavings = recommendations.reduce((sum, rec) => sum.plus(rec.monthly_savings), new Decimal(0));
  if (totalSavings.lessThanOrEqualTo(0)) return "Your AI stack is already close to optimal. Keep contracts aligned with active seats and review API usage monthly.";
  const top = recommendations.reduce((best, rec) => (rec.monthly_savings > best.monthly_savings ? rec : best));
  const toolName = top.tool_id.replace("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  return `Your audit found $${totalSavings.toDecimalPlaces(0).toString()}/month in potential AI savings. The largest opportunity is ${toolName}: moving from ${top.current_plan} to ${top.recommended_plan} could save $${new Decimal(top.monthly_savings).toDecimalPlaces(0).toString()}/month. Review plan tiers, seat counts, and API-heavy workflows before renewing annual contracts.`;
}

export class AuditEngine {
  runAudit(request: AuditRequest): AuditResult {
    const recommendations: ToolRecommendation[] = [];
    for (const userTool of request.tools) {
      const tool = getToolPricing(userTool.tool_id);
      if (!tool) throw new Error(`Unknown tool_id: ${userTool.tool_id}`);
      const currentMonthly = calculateMonthlyCost(userTool.monthly_spend, userTool.billing_cycle, userTool.annual_spend);
      const teamSize = userTool.team_size || request.team_size;
      const optimal = findOptimalTier(userTool.tool_id, userTool.current_plan, currentMonthly, teamSize);
      const monthlySavings = roundMoney(optimal.savings);
      const annualSavings = roundMoney(new Decimal(monthlySavings).times(12));
      const recommendedMonthly = roundMoney(optimal.price_monthly);
      const savingsPct = currentMonthly > 0 ? roundPercent(new Decimal(monthlySavings).dividedBy(currentMonthly).times(100)) : 0;
      recommendations.push({
        tool_id: userTool.tool_id,
        current_plan: userTool.current_plan,
        current_monthly_spend: currentMonthly,
        recommended_plan: optimal.tier_name,
        recommended_monthly_spend: recommendedMonthly,
        monthly_savings: monthlySavings,
        annual_savings: annualSavings,
        savings_percentage: Math.min(savingsPct, 99.9),
        reasoning: monthlySavings > 0 ? `Current spend is $${currentMonthly.toFixed(0)}/mo for ${teamSize} seat(s). A ${optimal.tier_name} plan is a defensible baseline at $${recommendedMonthly.toFixed(0)}/mo before usage-specific add-ons.` : `Current ${userTool.current_plan} spend is aligned with published pricing for ${teamSize} seat(s) or usage-based billing.`,
        alternative_tools: request.include_alternatives ? findAlternativeTools(userTool.tool_id) : null,
        flags: findFinanceFlags(userTool.tool_id, userTool.current_plan, teamSize),
      });
    }
    const totalMonthly = roundMoney(recommendations.reduce((sum, rec) => sum.plus(rec.current_monthly_spend), new Decimal(0)));
    const totalMonthlySavings = roundMoney(recommendations.reduce((sum, rec) => sum.plus(rec.monthly_savings), new Decimal(0)));
    const totalAnnual = roundMoney(new Decimal(totalMonthly).times(12));
    const totalAnnualSavings = roundMoney(new Decimal(totalMonthlySavings).times(12));
    return { audit_id: crypto.randomUUID(), created_at: new Date().toISOString(), total_monthly_spend: totalMonthly, total_annual_spend: totalAnnual, total_monthly_savings: totalMonthlySavings, total_annual_savings: totalAnnualSavings, savings_level: totalMonthlySavings > 500 ? "high" : totalMonthlySavings >= 100 ? "moderate" : "optimal", tool_recommendations: recommendations, summary: generateFallbackSummary(recommendations), ai_summary: null };
  }

  getPublicView(result: AuditResult): PublicAuditView {
    const savingsPct = result.total_monthly_spend > 0 ? roundPercent(new Decimal(result.total_monthly_savings).dividedBy(result.total_monthly_spend).times(100)) : 0;
    return { audit_id: result.audit_id, savings_level: result.savings_level, total_monthly_savings: result.total_monthly_savings, total_annual_savings: result.total_annual_savings, savings_percentage: Math.min(savingsPct, 99.9), created_at: result.created_at, tool_count: result.tool_recommendations.length };
  }
}
