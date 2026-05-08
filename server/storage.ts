import { eq } from "drizzle-orm";

import { AuditEngine } from "./auditEngine";
import { db } from "./db/client";
import { audits, leads } from "./db/schema";
import type { AuditResult, Lead, PublicAuditView } from "./models";

export class AuditStore {
  async saveAudit(audit: AuditResult): Promise<void> {
    await db.insert(audits).values({
      auditId: audit.audit_id,
      payload: audit,
      savingsLevel: audit.savings_level,
      totalMonthlySavings: audit.total_monthly_savings,
      totalAnnualSavings: audit.total_annual_savings,
      createdAt: audit.created_at,
    }).onConflictDoUpdate({
      target: audits.auditId,
      set: {
        payload: audit,
        savingsLevel: audit.savings_level,
        totalMonthlySavings: audit.total_monthly_savings,
        totalAnnualSavings: audit.total_annual_savings,
      },
    });
  }

  async getAudit(auditId: string): Promise<AuditResult | null> {
    const [row] = await db.select({ payload: audits.payload }).from(audits).where(eq(audits.auditId, auditId)).limit(1);
    return row?.payload ?? null;
  }

  async getPublicAudit(auditId: string): Promise<PublicAuditView | null> {
    const audit = await this.getAudit(auditId);
    return audit ? new AuditEngine().getPublicView(audit) : null;
  }

  async saveLead(lead: Lead): Promise<void> {
    await db.insert(leads).values({
      email: lead.email,
      company: lead.company ?? null,
      role: lead.role ?? null,
      teamSize: lead.team_size ?? null,
      auditId: lead.audit_id,
      leadSummary: lead.lead_summary ?? null,
      contactPriority: lead.contact_priority,
      createdAt: lead.created_at,
    });
  }
}
