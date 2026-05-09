"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { AuditRequest, AuditResponse, AuditResult, Lead, UseCase } from "../../server/models";
import { emptyForm, isSavedSpendForm, legacyStorageKey, levelCopy, normalizeForm, numeric, storageKey, tools, type FormSubmitHandler, type SavedSpendForm, type ToolSpend } from "./billauditData";
import { LeadSection, ResultsSection, SpendInputSection } from "./homeSections";

function emailLooksValid(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function readJsonResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("application/json")) {
    const body = await response.text();
    const serverReturnedHtml = body.trimStart().startsWith("<!DOCTYPE") || body.trimStart().startsWith("<html");
    throw new Error(serverReturnedHtml ? `${fallbackMessage} The server returned an HTML error page instead of JSON.` : `${fallbackMessage} The server returned a non-JSON response.`);
  }
  return await response.json() as T;
}

export function AuditExperience() {
  const [form, setForm] = useState<ToolSpend[]>(emptyForm);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [leadTeamSize, setLeadTeamSize] = useState("1");
  const [website, setWebsite] = useState("");
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [teamSize, setTeamSize] = useState("1");
  const [useCase, setUseCase] = useState<UseCase>("mixed");
  const [selectedToolId, setSelectedToolId] = useState("cursor");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "sent">("idle");
  const [message, setMessage] = useState("");
  const formLoaded = useRef(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = window.localStorage.getItem(storageKey) ?? window.localStorage.getItem(legacyStorageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as unknown;
          if (Array.isArray(parsed)) {
            setForm(normalizeForm(parsed as ToolSpend[]));
          } else if (isSavedSpendForm(parsed)) {
            setForm(normalizeForm(parsed.form));
            setTeamSize(parsed.teamSize);
            setUseCase(parsed.useCase);
          }
        } catch {
          window.localStorage.removeItem(storageKey);
          window.localStorage.removeItem(legacyStorageKey);
        }
      }
      formLoaded.current = true;
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!formLoaded.current) {
      return;
    }
    window.localStorage.setItem(storageKey, JSON.stringify({ version: 2, form, teamSize, useCase } satisfies SavedSpendForm));
  }, [form, teamSize, useCase]);

  const selectedCount = useMemo(() => form.filter((tool) => tool.enabled).length, [form]);
  const declaredSpend = useMemo(
    () => form.reduce((sum, tool) => sum + (tool.enabled ? numeric(tool.monthlySpend) : 0), 0),
    [form]
  );

  function updateTool(toolId: string, next: Partial<ToolSpend>) {
    setForm((current) =>
      current.map((tool) => (tool.toolId === toolId ? { ...tool, ...next } : tool))
    );
  }

  const runAudit: FormSubmitHandler = async (event) => {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const computedTeamSize = Math.max(1, Math.round(numeric(teamSize)));

    const payload: AuditRequest = {
      tools: form
        .filter((tool) => tool.enabled)
        .map((tool) => ({
          tool_id: tool.toolId,
          current_plan: tool.currentPlan,
          monthly_spend: numeric(tool.monthlySpend),
          annual_spend: tool.annualSpend ? numeric(tool.annualSpend) : null,
          billing_cycle: tool.billingCycle,
          team_size: Math.max(1, Math.round(numeric(tool.teamSize))),
        })),
      team_size: computedTeamSize,
      use_case: useCase,
      include_alternatives: true,
    };

    if (payload.tools.length === 0) {
      setStatus("error");
      setMessage("Select at least one tool to audit.");
      return;
    }

    if (computedTeamSize > 10_000 || payload.tools.some((tool) => tool.monthly_spend > 50_000)) {
      setStatus("error");
      setMessage("Check team size and monthly spend values before running the audit.");
      return;
    }

    try {
      const response = await fetch("/api/audit/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await readJsonResponse<AuditResponse>(response, "Audit failed.");
      if (!response.ok || !json.success || !json.data) {
        throw new Error(json.error ?? "Audit failed. Start the app server and try again.");
      }
      setResult(json.data);
      setPublicUrl(null);
      setStatus("idle");
      window.setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 80);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Audit failed. Start the backend and try again.");
    }
  };

  const captureLead: FormSubmitHandler = async (event) => {
    event.preventDefault();
    if (!result) {
      return;
    }
    setStatus("loading");
    const leadPayload: Lead = {
      email,
      company: company || null,
      role: role || null,
      team_size: leadTeamSize ? Math.max(1, Math.round(numeric(leadTeamSize))) : null,
      audit_id: result.audit_id,
      lead_summary: null,
      contact_priority: "standard",
      website,
    };
    if (!emailLooksValid(email)) {
      setStatus("error");
      setMessage("Enter a valid email address.");
      return;
    }
    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadPayload),
      });
      const json = await readJsonResponse<{ success?: boolean; error?: string; public_url?: string; email_status?: "sent" | "skipped" | "failed" }>(response, "Lead capture failed.");
      if (!response.ok || json.success === false) {
        throw new Error(json.error ?? "Lead capture failed.");
      }
      const nextPublicUrl = json.public_url ?? `/audit/${result.audit_id}`;
      setPublicUrl(nextPublicUrl);
      setStatus("sent");
      setMessage(`Report captured. Share URL unlocked${json.email_status === "sent" ? " and confirmation email sent" : ""}.`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Lead capture failed.");
    }
  };

  const level = result ? levelCopy(result.savings_level) : null;

  return (
    <>
      <SpendInputSection
        form={form}
        toolsConfig={tools}
        teamSize={teamSize}
        useCase={useCase}
        status={status}
        message={message}
        selectedCount={selectedCount}
        declaredSpend={declaredSpend}
        selectedToolId={selectedToolId}
        onSelectToolAction={setSelectedToolId}
        onTeamSizeChangeAction={setTeamSize}
        onUseCaseChangeAction={setUseCase}
        onUpdateToolAction={updateTool}
        onRunAuditAction={runAudit}
      />
      <ResultsSection result={result} level={level} />
      <LeadSection
        result={result}
        email={email}
        company={company}
        role={role}
        leadTeamSize={leadTeamSize}
        website={website}
        publicUrl={publicUrl}
        status={status}
        message={message}
        onEmailChangeAction={setEmail}
        onCompanyChangeAction={setCompany}
        onRoleChangeAction={setRole}
        onLeadTeamSizeChangeAction={setLeadTeamSize}
        onWebsiteChangeAction={setWebsite}
        onCaptureLeadAction={captureLead}
      />
    </>
  );
}
