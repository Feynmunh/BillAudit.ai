import { z } from "zod";

export const billingCycleSchema = z.enum(["monthly", "annual"]);
export const toolCategorySchema = z.enum(["coding", "chat", "api", "other"]);
export const savingsLevelSchema = z.enum(["high", "moderate", "optimal"]);

export const pricingTierSchema = z.object({
  name: z.string(),
  price_monthly: z.number().nonnegative(),
  price_annual: z.number().nonnegative().nullable().optional(),
  features: z.array(z.string()).default([]),
  limits: z.string().nullable().optional(),
});

export const toolPricingSchema = z.object({
  tool_id: z.string().regex(/^[a-z0-9_]+$/),
  name: z.string(),
  category: toolCategorySchema,
  url: z.string().url(),
  tiers: z.array(pricingTierSchema).min(1),
  free_tier_available: z.boolean().default(false),
  pay_as_you_go: z.boolean().default(false),
  api_pricing_note: z.string().nullable().optional(),
});

export const userToolSpendSchema = z.object({
  tool_id: z.string(),
  current_plan: z.string(),
  monthly_spend: z.coerce.number().nonnegative().max(50_000, "Monthly spend seems unrealistically high (> $50,000)").transform((value) => Math.round(value * 100) / 100),
  billing_cycle: billingCycleSchema.default("monthly"),
  annual_spend: z.coerce.number().nonnegative().nullable().optional(),
  team_size: z.coerce.number().int().min(1).default(1),
  usage_description: z.string().max(500).nullable().optional(),
});

export const auditRequestSchema = z.object({
  tools: z.array(userToolSpendSchema).min(1).max(20),
  team_size: z.coerce.number().int().min(1).max(10_000).default(1),
  industry: z.string().nullable().optional(),
  use_case: z.string().max(500).nullable().optional(),
  include_alternatives: z.boolean().default(true),
}).superRefine((request, context) => {
  const seen = new Set<string>();
  for (const [index, tool] of request.tools.entries()) {
    if (seen.has(tool.tool_id)) {
      context.addIssue({ code: "custom", path: ["tools", index, "tool_id"], message: `Duplicate tool_id: ${tool.tool_id}` });
    }
    seen.add(tool.tool_id);
  }
});

export const leadSchema = z.object({
  email: z.string().email(),
  company: z.string().max(200).nullable().optional(),
  role: z.string().max(100).nullable().optional(),
  team_size: z.coerce.number().int().min(1).max(10_000).nullable().optional(),
  audit_id: z.string().min(1),
  lead_summary: z.string().max(700).nullable().optional(),
  contact_priority: z.enum(["standard", "high_savings"]).default("standard"),
  website: z.string().max(500).optional(),
  created_at: z.string().datetime().optional(),
});

export type BillingCycle = z.infer<typeof billingCycleSchema>;
export type ToolCategory = z.infer<typeof toolCategorySchema>;
export type SavingsLevel = z.infer<typeof savingsLevelSchema>;
export type PricingTier = z.infer<typeof pricingTierSchema>;
export type ToolPricing = z.infer<typeof toolPricingSchema>;
export type UserToolSpend = z.infer<typeof userToolSpendSchema>;
export type AuditRequest = z.infer<typeof auditRequestSchema>;
export type Lead = z.infer<typeof leadSchema>;

export type ToolRecommendation = {
  tool_id: string;
  current_plan: string;
  current_monthly_spend: number;
  recommended_plan: string;
  recommended_monthly_spend: number;
  monthly_savings: number;
  annual_savings: number;
  savings_percentage: number;
  reasoning: string;
  alternative_tools: string[] | null;
  flags: string[];
};

export type AuditResult = {
  audit_id: string;
  created_at: string;
  total_monthly_spend: number;
  total_annual_spend: number;
  total_monthly_savings: number;
  total_annual_savings: number;
  savings_level: SavingsLevel;
  tool_recommendations: ToolRecommendation[];
  summary: string | null;
  ai_summary: string | null;
};

export type PublicAuditView = {
  audit_id: string;
  savings_level: SavingsLevel;
  total_monthly_savings: number;
  total_annual_savings: number;
  savings_percentage: number;
  created_at: string;
  tool_count: number;
  tools: Array<Pick<ToolRecommendation, "tool_id" | "current_plan" | "recommended_plan" | "monthly_savings" | "annual_savings" | "savings_percentage" | "flags">>;
};

export type AuditResponse = {
  success: boolean;
  data?: AuditResult;
  error?: string;
};
