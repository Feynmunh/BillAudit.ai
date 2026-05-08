import { describe, expect, it } from "vitest";

import { AuditEngine, calculateAnnualCost, calculateMonthlyCost } from "./auditEngine";
import { auditRequestSchema } from "./models";

describe("AuditEngine", () => {
  it("calculates savings for obvious overspend", () => {
    const request = auditRequestSchema.parse({ tools: [{ tool_id: "cursor", current_plan: "Enterprise", monthly_spend: 500, team_size: 1 }] });
    const result = new AuditEngine().runAudit(request);
    expect(result.tool_recommendations[0]?.recommended_plan).toBe("Pro");
    expect(result.tool_recommendations[0]?.monthly_savings).toBe(480);
    expect(result.tool_recommendations[0]?.annual_savings).toBe(5760);
    expect(result.savings_level).toBe("moderate");
  });

  it("marks stack optimal when published pricing matches spend", () => {
    const request = auditRequestSchema.parse({ tools: [{ tool_id: "chatgpt", current_plan: "Team", monthly_spend: 90, team_size: 3 }] });
    const result = new AuditEngine().runAudit(request);
    expect(result.tool_recommendations[0]?.monthly_savings).toBe(0);
    expect(result.tool_recommendations[0]?.recommended_plan).toBe("Team");
    expect(result.savings_level).toBe("optimal");
  });

  it("normalizes annual billing to monthly cost", () => {
    expect(calculateMonthlyCost(0, "annual", 240)).toBe(20);
    expect(calculateAnnualCost(20, "monthly")).toBe(240);
  });

  it("does not create false positive savings for usage-based API spend", () => {
    const request = auditRequestSchema.parse({ tools: [{ tool_id: "openai_api", current_plan: "Pay-as-you-go", monthly_spend: 700 }] });
    const result = new AuditEngine().runAudit(request);
    expect(result.tool_recommendations[0]?.monthly_savings).toBe(0);
    expect(result.tool_recommendations[0]?.recommended_plan).toBe("Pay-as-you-go");
    expect(result.total_monthly_spend).toBe(700);
  });

  it("uses high savings tier above five hundred monthly", () => {
    const request = auditRequestSchema.parse({ tools: [{ tool_id: "cursor", current_plan: "Enterprise", monthly_spend: 900, team_size: 1 }] });
    const result = new AuditEngine().runAudit(request);
    expect(result.total_monthly_savings).toBe(880);
    expect(result.savings_level).toBe("high");
  });

  it("fails fast for unknown tool ids", () => {
    const request = auditRequestSchema.parse({ tools: [{ tool_id: "unknown_vendor", current_plan: "Pro", monthly_spend: 100 }] });
    expect(() => new AuditEngine().runAudit(request)).toThrow("Unknown tool_id");
  });

  it("rejects duplicate tool ids", () => {
    const parsed = auditRequestSchema.safeParse({ tools: [{ tool_id: "cursor", current_plan: "Pro", monthly_spend: 20 }, { tool_id: "cursor", current_plan: "Business", monthly_spend: 40 }] });
    expect(parsed.success).toBe(false);
  });

  it("creates UUID audit ids", () => {
    const request = auditRequestSchema.parse({ tools: [{ tool_id: "cursor", current_plan: "Pro", monthly_spend: 20 }] });
    const result = new AuditEngine().runAudit(request);
    expect(result.audit_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it("accepts a supported primary use case", () => {
    const parsed = auditRequestSchema.safeParse({ use_case: "coding", tools: [{ tool_id: "cursor", current_plan: "Pro", monthly_spend: 20 }] });
    expect(parsed.success).toBe(true);
  });

  it("flags small teams on team or enterprise plans", () => {
    const request = auditRequestSchema.parse({ tools: [{ tool_id: "chatgpt", current_plan: "Team", monthly_spend: 60, team_size: 2 }] });
    const result = new AuditEngine().runAudit(request);
    expect(result.tool_recommendations[0]?.flags[0]).toContain("team size under 3");
  });
});
