import { integer, jsonb, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import type { AuditResult } from "../models";

export const audits = pgTable("audits", {
  auditId: uuid("audit_id").primaryKey(),
  payload: jsonb("payload").$type<AuditResult>().notNull(),
  savingsLevel: text("savings_level").notNull(),
  totalMonthlySavings: numeric("total_monthly_savings", { mode: "number" }).notNull().default(0),
  totalAnnualSavings: numeric("total_annual_savings", { mode: "number" }).notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});

export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  company: text("company"),
  role: text("role"),
  teamSize: integer("team_size"),
  auditId: uuid("audit_id").notNull().references(() => audits.auditId, { onDelete: "cascade" }),
  leadSummary: text("lead_summary"),
  contactPriority: text("contact_priority").notNull().default("standard"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
});
