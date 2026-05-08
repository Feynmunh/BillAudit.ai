import express, { type ErrorRequestHandler, type RequestHandler } from "express";
import { ZodError } from "zod";

import { AuditEngine } from "./auditEngine";
import { sendAuditConfirmationEmail } from "./emailService";
import { auditRequestSchema, leadSchema } from "./models";
import { getPricingDatabase } from "./pricingData";
import { AuditStore } from "./storage";
import { generateLeadBrief, generatePersonalizedSummary } from "./summaryService";

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

export function createApiRouter(): express.Router {
  const router = express.Router();
  const auditEngine = new AuditEngine();
  const auditStore = new AuditStore();

  router.get("/api/health", (_request, response) => response.json({ message: "BillAudit API", version: "1.0.0" }));
  router.get("/api/tools", (_request, response) => response.json({ tools: getPricingDatabase().map((tool) => ({ tool_id: tool.tool_id, name: tool.name, category: tool.category, tiers: tool.tiers.map((tier) => ({ name: tier.name, price_monthly: tier.price_monthly })) })) }));

  router.post("/api/audit/calculate", async (request, response, next) => {
    try {
      const parsed = auditRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        response.status(400).json({ success: false, error: parsed.error.issues.map((issue) => issue.message).join("; ") });
        return;
      }
      const result = auditEngine.runAudit(parsed.data);
      result.ai_summary = await generatePersonalizedSummary(result);
      await auditStore.saveAudit(result);
      response.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  });

  router.post("/api/audit", async (request, response, next) => {
    try {
      const parsed = auditRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        response.status(400).json({ success: false, error: parsed.error.issues.map((issue) => issue.message).join("; ") });
        return;
      }
      const result = auditEngine.runAudit(parsed.data);
      result.ai_summary = await generatePersonalizedSummary(result);
      await auditStore.saveAudit(result);
      response.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  });

  router.get("/api/audit/:auditId", async (request, response, next) => {
    try {
      const audit = await auditStore.getAudit(request.params.auditId);
      if (!audit) {
        response.status(404).json({ detail: "Audit not found" });
        return;
      }
      response.json({ success: true, data: audit });
    } catch (error) {
      next(error);
    }
  });

  router.get("/api/share/:auditId", async (request, response, next) => {
    try {
      const publicAudit = await auditStore.getPublicAudit(request.params.auditId);
      if (!publicAudit) {
        response.status(404).json({ detail: "Audit not found" });
        return;
      }
      response.json(publicAudit);
    } catch (error) {
      next(error);
    }
  });

  router.post("/api/lead", async (request, response, next) => {
    try {
      const honeypot = typeof request.body?.website === "string" ? request.body.website.trim() : "";
      if (honeypot) {
        response.json({ success: true, message: "Lead captured" });
        return;
      }
      const rateLimitKey = request.ip ?? request.socket.remoteAddress ?? "unknown";
      if (isLeadRateLimited(rateLimitKey)) {
        response.status(429).json({ success: false, error: "Too many lead requests. Try again later." });
        return;
      }
      const parsed = leadSchema.safeParse({ ...request.body, created_at: new Date().toISOString() });
      if (!parsed.success) {
        response.status(400).json({ success: false, error: parsed.error.issues.map((issue) => issue.message).join("; ") });
        return;
      }
      const audit = await auditStore.getAudit(parsed.data.audit_id);
      if (!audit) {
        response.status(404).json({ success: false, error: "Audit not found" });
        return;
      }
      const enrichedLead = {
        ...parsed.data,
        contact_priority: audit.savings_level === "high" ? "high_savings" as const : "standard" as const,
        lead_summary: await generateLeadBrief(audit, parsed.data),
      };
      await auditStore.saveLead(enrichedLead);
      const origin = typeof request.headers.origin === "string" ? request.headers.origin : `${request.protocol}://${request.get("host")}`;
      const email_status = await sendAuditConfirmationEmail(enrichedLead, audit, `${origin}/audit/${audit.audit_id}`);
      response.json({ success: true, message: "Lead captured", email_status, public_url: `/audit/${audit.audit_id}` });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

export const corsMiddleware: RequestHandler = (request, response, next) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Credentials", "true");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (request.method === "OPTIONS") {
    response.sendStatus(204);
    return;
  }
  next();
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  void next;
  if (error instanceof ZodError) {
    response.status(400).json({ success: false, error: error.issues.map((issue) => issue.message).join("; ") });
    return;
  }
  const message = error instanceof Error ? error.message : "Internal error";
  const status = message.startsWith("Unknown tool_id") ? 400 : 500;
  response.status(status).json({ success: false, error: status === 500 ? `Internal error: ${message}` : message });
};
