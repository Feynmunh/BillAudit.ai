import type { NextRequest } from "next/server";

import { sendAuditConfirmationEmail } from "@/server/emailService";
import { leadSchema } from "@/server/models";
import { AuditStore } from "@/server/storage";
import { generateLeadBrief } from "@/server/summaryService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const auditStore = new AuditStore();
const leadRateLimit = new Map<string, { count: number; resetAt: number }>();

function isLeadRateLimited(key: string): boolean {
  const now = Date.now();
  const current = leadRateLimit.get(key);
  if (!current || current.resetAt < now) {
    leadRateLimit.set(key, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return false;
  }
  current.count += 1;
  return current.count > 5;
}

function clientKey(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const honeypot = body && typeof body === "object" && "website" in body && typeof body.website === "string" ? body.website.trim() : "";
    if (honeypot) {
      return Response.json({ success: true, message: "Lead captured" });
    }

    if (isLeadRateLimited(clientKey(request))) {
      return Response.json({ success: false, error: "Too many lead requests. Try again later." }, { status: 429 });
    }

    const parsed = leadSchema.safeParse({ ...(body && typeof body === "object" ? body : {}), created_at: new Date().toISOString() });
    if (!parsed.success) {
      return Response.json({ success: false, error: parsed.error.issues.map((issue) => issue.message).join("; ") }, { status: 400 });
    }

    const audit = await auditStore.getAudit(parsed.data.audit_id);
    if (!audit) {
      return Response.json({ success: false, error: "Audit not found" }, { status: 404 });
    }

    const enrichedLead = {
      ...parsed.data,
      contact_priority: audit.savings_level === "high" ? "high_savings" as const : "standard" as const,
      lead_summary: await generateLeadBrief(audit, parsed.data),
    };
    await auditStore.saveLead(enrichedLead);

    const origin = request.headers.get("origin") ?? new URL(request.url).origin;
    const email_status = await sendAuditConfirmationEmail(enrichedLead, audit, `${origin}/audit/${audit.audit_id}`);

    return Response.json({ success: true, message: "Lead captured", email_status, public_url: `/audit/${audit.audit_id}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return Response.json({ success: false, error: `Internal error: ${message}` }, { status: 500 });
  }
}
