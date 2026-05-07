import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { AuditEngine } from "./auditEngine.js";
import type { AuditResult, Lead, PublicAuditView } from "./models.js";

type PayloadRow = { payload: AuditResult };

function hasPayload(value: unknown): value is PayloadRow {
  return typeof value === "object" && value !== null && "payload" in value;
}

export class AuditStore {
  private readonly client: SupabaseClient;

  constructor() {
    const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("Supabase is required: set SUPABASE_URL and SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY.");
    }
    this.client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  }

  async saveAudit(audit: AuditResult): Promise<void> {
    const { error } = await this.client.from("audits").upsert({ audit_id: audit.audit_id, payload: audit, savings_level: audit.savings_level, total_monthly_savings: audit.total_monthly_savings, total_annual_savings: audit.total_annual_savings });
    if (error) throw error;
  }

  async getAudit(auditId: string): Promise<AuditResult | null> {
    const { data, error } = await this.client.from("audits").select("payload").eq("audit_id", auditId).limit(1).maybeSingle();
    if (error) throw error;
    return hasPayload(data) ? data.payload : null;
  }

  async getPublicAudit(auditId: string): Promise<PublicAuditView | null> {
    const audit = await this.getAudit(auditId);
    return audit ? new AuditEngine().getPublicView(audit) : null;
  }

  async saveLead(lead: Lead): Promise<void> {
    const { error } = await this.client.from("leads").insert(lead);
    if (error) throw error;
  }
}
