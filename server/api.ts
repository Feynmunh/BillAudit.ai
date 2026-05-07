import express, { type ErrorRequestHandler, type RequestHandler } from "express";
import { ZodError } from "zod";

import { AuditEngine } from "./auditEngine.js";
import { auditRequestSchema, leadSchema } from "./models.js";
import { getPricingDatabase } from "./pricingData.js";
import { AuditStore } from "./storage.js";
import { generatePersonalizedSummary } from "./summaryService.js";

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
      const parsed = leadSchema.safeParse({ ...request.body, created_at: new Date().toISOString() });
      if (!parsed.success) {
        response.status(400).json({ success: false, error: parsed.error.issues.map((issue) => issue.message).join("; ") });
        return;
      }
      await auditStore.saveLead(parsed.data);
      response.json({ success: true, message: "Lead captured" });
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
