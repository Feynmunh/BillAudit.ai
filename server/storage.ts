import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { AuditEngine } from "./auditEngine.js";
import type { AuditResult, Lead, PublicAuditView } from "./models.js";

type PayloadRow = { payload: AuditResult };

function hasPayload(value: unknown): value is PayloadRow {
  return typeof value === "object" && value !== null && "payload" in value;
}

export class AuditStore {
  private readonly audits = new Map<string, AuditResult>();
  private readonly leads = new Map<string, Lead>();
  private readonly client: SupabaseClient | null;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
    this.client = url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }) : null;
  }

  async saveAudit(audit: AuditResult): Promise<void> {
    this.audits.set(audit.audit_id, audit);
    if (!this.client) return;
    const { error } = await this.client.from("audit_results").upsert({ audit_id: audit.audit_id, payload: audit, savings_level: audit.savings_level, total_monthly_savings: audit.total_monthly_savings, total_annual_savings: audit.total_annual_savings });
    if (error) throw error;
  }

  async getAudit(auditId: string): Promise<AuditResult | null> {
    const cached = this.audits.get(auditId);
    if (cached) return cached;
    if (!this.client) return null;
    const { data, error } = await this.client.from("audit_results").select("payload").eq("audit_id", auditId).limit(1).maybeSingle();
    if (error) throw error;
    return hasPayload(data) ? data.payload : null;
  }

  async getPublicAudit(auditId: string): Promise<PublicAuditView | null> {
    const audit = await this.getAudit(auditId);
    return audit ? new AuditEngine().getPublicView(audit) : null;
  }

  async saveLead(lead: Lead): Promise<void> {
    this.leads.set(lead.email, lead);
    if (!this.client) return;
    const { error } = await this.client.from("leads").insert(lead);
    if (error) throw error;
  }
}
