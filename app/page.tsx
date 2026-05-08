"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { auditRequestSchema, leadSchema, type AuditRequest, type AuditResponse, type AuditResult, type Lead, type UseCase } from "../server/models";

type BillingCycle = "monthly" | "annual";
type SavingsLevel = AuditResult["savings_level"];

type ToolConfig = {
  id: string;
  name: string;
  category: string;
  accent: string;
  defaultPlan: string;
  plans: string[];
};

type ToolSpend = {
  toolId: string;
  enabled: boolean;
  currentPlan: string;
  monthlySpend: string;
  annualSpend: string;
  billingCycle: BillingCycle;
  teamSize: string;
};

type SavedSpendForm = {
  version: 2;
  form: ToolSpend[];
  teamSize: string;
  useCase: UseCase;
};

const useCaseOptions: Array<{ value: UseCase; label: string }> = [
  { value: "coding", label: "Coding" },
  { value: "writing", label: "Writing" },
  { value: "data", label: "Data" },
  { value: "research", label: "Research" },
  { value: "mixed", label: "Mixed" },
];

const tools: ToolConfig[] = [
  { id: "cursor", name: "Cursor", category: "Coding", accent: "#19e272", defaultPlan: "Pro", plans: ["Hobby", "Pro", "Business", "Enterprise"] },
  { id: "github_copilot", name: "GitHub Copilot", category: "Coding", accent: "#7c3cff", defaultPlan: "Business", plans: ["Individual", "Business", "Enterprise"] },
  { id: "claude", name: "Claude", category: "Chat", accent: "#ff6b2b", defaultPlan: "Pro", plans: ["Free", "Pro", "Max", "Team", "Enterprise", "API direct"] },
  { id: "chatgpt", name: "ChatGPT", category: "Chat", accent: "#0ea5e9", defaultPlan: "Team", plans: ["Plus", "Team", "Enterprise", "API direct"] },
  { id: "anthropic_api", name: "Anthropic API", category: "API", accent: "#ff8bd2", defaultPlan: "API direct", plans: ["API direct"] },
  { id: "openai_api", name: "OpenAI API", category: "API", accent: "#f97316", defaultPlan: "API direct", plans: ["API direct"] },
  { id: "gemini", name: "Gemini", category: "Chat", accent: "#f6d743", defaultPlan: "Pro", plans: ["Pro", "Ultra", "API"] },
  { id: "windsurf", name: "Windsurf", category: "Coding", accent: "#10b981", defaultPlan: "Pro", plans: ["Pro", "Teams", "Enterprise"] },
];

const emptyForm = tools.map((tool) => ({
  toolId: tool.id,
  enabled: tool.id === "cursor" || tool.id === "chatgpt",
  currentPlan: tool.defaultPlan,
  monthlySpend: tool.id === "cursor" ? "80" : tool.id === "chatgpt" ? "30" : "0",
  annualSpend: "",
  billingCycle: "monthly" as BillingCycle,
  teamSize: "1",
}));

const storageKey = "billaudit.spend-form.v2";
const legacyStorageKey = "billaudit.spend-form.v1";

function currency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function numeric(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function normalizeForm(saved: ToolSpend[]): ToolSpend[] {
  return emptyForm.map((fallback) => {
    const current = saved.find((tool) => tool.toolId === fallback.toolId);
    if (!current) {
      return fallback;
    }
    const config = tools.find((tool) => tool.id === fallback.toolId);
    const currentPlan = config?.plans.includes(current.currentPlan) ? current.currentPlan : fallback.currentPlan;
    return { ...fallback, ...current, currentPlan };
  });
}

function isUseCase(value: unknown): value is UseCase {
  return typeof value === "string" && useCaseOptions.some((option) => option.value === value);
}

function isSavedSpendForm(value: unknown): value is SavedSpendForm {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<SavedSpendForm>;
  return Array.isArray(candidate.form) && typeof candidate.teamSize === "string" && isUseCase(candidate.useCase);
}

function levelCopy(level: SavingsLevel): { label: string; title: string; body: string } {
  if (level === "high") {
    return {
      label: "High savings",
      title: "You are leaking budget every month.",
      body: "This stack deserves immediate contract review before the next renewal cycle.",
    };
  }
  if (level === "moderate") {
    return {
      label: "Moderate savings",
      title: "There is meaningful optimization room.",
      body: "A few plan and seat-count adjustments can compound into a cleaner annual run-rate.",
    };
  }
  return {
    label: "Optimal spend",
    title: "Your stack is close to clean.",
    body: "Keep auditing API usage and seat counts as the team grows.",
  };
}

export default function Home() {
  const [form, setForm] = useState<ToolSpend[]>(emptyForm);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [leadTeamSize, setLeadTeamSize] = useState("1");
  const [website, setWebsite] = useState("");
  const [teamSize, setTeamSize] = useState("1");
  const [useCase, setUseCase] = useState<UseCase>("mixed");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "sent">("idle");
  const [message, setMessage] = useState("");
  const formLoaded = useRef(false);
  const auditForm = useForm<z.input<typeof auditRequestSchema>, unknown, AuditRequest>({ resolver: zodResolver(auditRequestSchema), defaultValues: { tools: [], team_size: 1, industry: null, use_case: null, include_alternatives: true } });
  const leadForm = useForm<z.input<typeof leadSchema>, unknown, Lead>({ resolver: zodResolver(leadSchema) });

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

  async function runAudit(event: FormEvent<HTMLFormElement>) {
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

    const parsed = auditRequestSchema.safeParse(payload);
    if (!parsed.success) {
      setStatus("error");
      setMessage(parsed.error.issues.map((issue) => issue.message).join("; "));
      return;
    }

    auditForm.reset(parsed.data);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/audit/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = (await response.json()) as AuditResponse;
      if (!response.ok || !json.success || !json.data) {
        throw new Error(json.error ?? "Audit failed. Start the app server and try again.");
      }
      setResult(json.data);
      setStatus("idle");
      window.setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 80);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Audit failed. Start the backend and try again.");
    }
  }

  async function captureLead(event: FormEvent<HTMLFormElement>) {
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
    const parsedLead = leadSchema.safeParse(leadPayload);
    if (!parsedLead.success) {
      setStatus("error");
      setMessage(parsedLead.error.issues.map((issue) => issue.message).join("; "));
      return;
    }
    leadForm.reset(parsedLead.data);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedLead.data),
      });
      if (!response.ok) {
        throw new Error("Lead capture failed.");
      }
      setStatus("sent");
      const json = (await response.json()) as { public_url?: string; email_status?: "sent" | "skipped" | "failed" };
      setMessage(`AI brief saved. Share URL: ${json.public_url ?? `/audit/${result.audit_id}`}${json.email_status === "sent" ? " · Email sent" : ""}`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Lead capture failed.");
    }
  }

  const level = result ? levelCopy(result.savings_level) : null;

  return (
    <main className="min-h-screen bg-[#f8f7f2] text-[#111111]">
      <section className="border-b border-black/10 bg-[#17e86f] px-5 py-3 text-center font-mono text-xs uppercase tracking-[0.18em] text-black/80">
        Instant AI spend audit · no login required · built for Credex operators
      </section>

      <nav className="flex items-center justify-between border-b border-black/10 bg-white/90 px-5 py-5 backdrop-blur lg:px-10">
        <a href="#top" className="flex items-center gap-3" aria-label="BillAudit home">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-black text-xl font-semibold text-[#17e86f]">B</span>
          <span className="text-2xl font-medium tracking-tight">billaudit</span>
        </a>
        <div className="hidden items-center gap-8 font-mono text-xs uppercase tracking-[0.16em] text-black/60 md:flex">
          <a href="#audit">Audit</a>
          <a href="#results">Results</a>
          <a href="#lead">Share</a>
        </div>
        <a href="#audit" className="button-primary">Run audit</a>
      </nav>

      <section id="top" className="grid min-h-[680px] border-b border-black/10 bg-white lg:grid-cols-[1fr_0.9fr]">
        <div className="flex flex-col justify-center border-b border-black/10 p-6 lg:border-b-0 lg:border-r lg:p-12">
          <p className="mb-6 font-mono text-xs uppercase tracking-[0.28em] text-black/50">AI finance control plane</p>
          <h1 className="max-w-4xl text-[clamp(3.4rem,7.6vw,7.4rem)] font-semibold leading-[0.92] tracking-[-0.07em]">
            Audit your AI burn before renewal.
          </h1>
          <p className="mt-8 max-w-2xl text-xl leading-[1.25] text-black/66 lg:text-3xl">
            Surface wasted spend across Cursor, Claude, ChatGPT, Gemini and API usage in under a minute.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a href="#audit" className="button-primary">Get instant audit →</a>
            <a href="#results" className="button-secondary">See savings model →</a>
          </div>
        </div>
        <div className="relative min-h-[560px] overflow-hidden bg-[#f8f7f2]">
          <div className="audit-visual" aria-hidden="true">
            <div className="diagram-frame" />
            <div className="hero-panel panel-stack">
              <span>YOUR AI STACK</span>
              <strong>$18.4K/mo</strong>
            </div>
            <div className="hero-panel panel-audit">
              <span>BILLAUDIT</span>
              <strong>$2.8K found</strong>
            </div>
            <div className="hero-panel panel-action">
              <span>NEXT RENEWAL</span>
              <strong>clean plan</strong>
            </div>
            <div className="hero-wire wire-stack" />
            <div className="hero-wire wire-action" />
            <div className="hero-block block-a" />
            <div className="hero-block block-b" />
          </div>
        </div>
      </section>

      <section className="grid border-b border-black/10 bg-white md:grid-cols-3">
        {["No login gate before value", "Finance-literate recommendations", "Public audit link for sharing"].map((item) => (
          <div key={item} className="border-b border-black/10 p-6 md:border-b-0 md:border-r last:border-r-0">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.24em] text-black/40">Operator promise</p>
            <p className="mt-4 text-2xl font-medium tracking-tight">{item}</p>
          </div>
        ))}
      </section>

      <section id="audit" className="bg-[#f8f7f2] px-5 py-14 lg:px-10 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="lg:sticky lg:top-8 lg:self-start">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-black/45">Spend input</p>
            <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-[0.98] tracking-[-0.04em] lg:text-6xl">
              A cleaner way to map AI spend.
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-black/60">
              Choose the tools you pay for, set team size and use case, then enter each plan, monthly spend, and seats.
            </p>
            <div className="mt-8 grid gap-3 font-mono text-xs uppercase tracking-[0.12em]">
              <div className="metric-row"><span>Selected</span><strong>{selectedCount}</strong></div>
              <div className="metric-row"><span>Monthly spend</span><strong>{currency(declaredSpend)}</strong></div>
              <div className="metric-row"><span>Autosave</span><strong>On</strong></div>
            </div>
          </div>

          <form onSubmit={runAudit} className="border border-black/10 bg-white p-4 shadow-[0_30px_80px_rgb(0_0_0/0.08)] lg:p-5">
            <div className="grid gap-3">
              <div className="grid gap-3 bg-[#f8f7f2] p-4 md:grid-cols-[0.85fr_1.15fr]">
                <label className="field-label">
                  Team size
                  <input inputMode="numeric" value={teamSize} onChange={(event) => setTeamSize(event.target.value)} className="field-input" placeholder="Example: 12" />
                </label>
                <label className="field-label">
                  Primary use case
                  <select value={useCase} onChange={(event) => setUseCase(event.target.value as UseCase)} className="field-input">
                    {useCaseOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
              </div>
              {form.map((toolSpend) => {
                const config = tools.find((tool) => tool.id === toolSpend.toolId);
                if (!config) {
                  return null;
                }
                return (
                  <fieldset key={toolSpend.toolId} className="tool-row">
                    <label className="flex min-w-0 items-center gap-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-black"
                        checked={toolSpend.enabled}
                        onChange={(event) => updateTool(toolSpend.toolId, { enabled: event.target.checked })}
                      />
                      <span className="grid min-w-0 gap-1">
                        <span className="truncate text-xl font-medium tracking-tight" style={{ color: config.accent }}>{config.name}</span>
                        <span className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-black/38">{config.category}</span>
                      </span>
                    </label>
                    <div className="grid gap-3 md:grid-cols-[1.1fr_0.8fr_0.55fr_0.85fr]">
                      <label className="field-label">
                        Plan
                        <select value={toolSpend.currentPlan} onChange={(event) => updateTool(toolSpend.toolId, { currentPlan: event.target.value })} className="field-input">
                          {config.plans.map((plan) => <option key={plan} value={plan}>{plan}</option>)}
                        </select>
                      </label>
                      <label className="field-label">
                        Monthly $
                        <input inputMode="decimal" value={toolSpend.monthlySpend} onChange={(event) => updateTool(toolSpend.toolId, { monthlySpend: event.target.value })} className="field-input" />
                      </label>
                      <label className="field-label">
                        Seats
                        <input inputMode="numeric" value={toolSpend.teamSize} onChange={(event) => updateTool(toolSpend.toolId, { teamSize: event.target.value })} className="field-input" />
                      </label>
                      <label className="field-label">
                        Billing
                        <select value={toolSpend.billingCycle} onChange={(event) => updateTool(toolSpend.toolId, { billingCycle: event.target.value as BillingCycle })} className="field-input">
                          <option value="monthly">Monthly</option>
                          <option value="annual">Annual</option>
                        </select>
                      </label>
                    </div>
                  </fieldset>
                );
              })}
            </div>
            <div className="mt-5 flex flex-col gap-4 bg-[#f8f7f2] p-4 lg:flex-row lg:items-center lg:justify-between">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-black/48">Draft autosaves across reloads.</p>
              <button type="submit" className="button-primary" disabled={status === "loading"}>
                {status === "loading" ? "Auditing..." : "Run spend audit →"}
              </button>
            </div>
            {message && <p className="mt-4 bg-red-50 p-4 font-mono text-xs uppercase tracking-[0.12em] text-red-700">{message}</p>}
          </form>
        </div>
      </section>

      <section id="results" className="border-y border-black/10 bg-white p-5 lg:p-10">
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-black/45">Audit dashboard</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-[-0.04em] lg:text-6xl">Savings signal.</h2>
          </div>
          {level && <p className="max-w-xl text-xl leading-snug text-black/60">{level.body}</p>}
        </div>

        {!result ? (
          <div className="grid min-h-[260px] place-items-center border border-black/10 bg-[#f8f7f2] text-center">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-black/40">Waiting for input</p>
              <p className="mt-4 text-3xl font-medium tracking-tight">Run the audit to reveal savings.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-5">
            <div className="grid gap-5 lg:grid-cols-4">
              <div className="result-card lg:col-span-2">
                <p className="font-mono text-xs uppercase tracking-[0.25em] text-black/45">Monthly savings</p>
                <p className="mt-4 text-6xl font-semibold tracking-[-0.05em] text-[#13b95a]">{currency(result.total_monthly_savings)}</p>
              </div>
              <div className="result-card">
                <p className="font-mono text-xs uppercase tracking-[0.25em] text-black/45">Annual savings</p>
                <p className="mt-4 text-4xl font-semibold tracking-tight">{currency(result.total_annual_savings)}</p>
              </div>
              <div className="result-card">
                <p className="font-mono text-xs uppercase tracking-[0.25em] text-black/45">Tier</p>
                <p className="mt-4 text-4xl font-semibold tracking-tight">{level?.label}</p>
              </div>
            </div>
            <div className="result-card">
              <p className="text-2xl font-medium leading-snug text-black/75">{result.ai_summary ?? result.summary}</p>
            </div>
            <div className="grid gap-4">
              {result.tool_recommendations.map((rec) => (
                <article key={rec.tool_id} className="grid gap-5 border border-black/10 bg-white p-5 shadow-[0_12px_40px_rgb(0_0_0/0.05)] md:grid-cols-[0.6fr_1fr_0.4fr]">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.25em] text-black/45">{rec.current_plan} → {rec.recommended_plan}</p>
                    <h3 className="mt-2 text-3xl font-semibold capitalize tracking-tight">{rec.tool_id.replace("_", " ")}</h3>
                  </div>
                  <p className="text-xl leading-snug text-black/70">{rec.reasoning}</p>
                  {rec.flags.length > 0 && (
                    <ul className="md:col-span-2 grid gap-2 font-mono text-xs uppercase tracking-[0.12em] text-black/55">
                      {rec.flags.map((flag) => <li key={flag}>Flag: {flag}</li>)}
                    </ul>
                  )}
                  <div className="text-left md:text-right">
                    <p className="font-mono text-xs uppercase tracking-[0.25em] text-black/45">Save/mo</p>
                    <p className="text-3xl font-semibold text-[#13b95a]">{currency(rec.monthly_savings)}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      <section id="lead" className="grid bg-[#111111] text-white lg:grid-cols-[1fr_0.8fr]">
        <div className="border-b border-white/10 p-6 lg:border-b-0 lg:border-r lg:p-12">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-white/45">AI follow-up</p>
          <h2 className="mt-4 max-w-3xl text-4xl font-medium leading-[1] tracking-[-0.04em] lg:text-6xl">Claim the clean version.</h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/55">Drop an email. Gemini writes the internal Credex brief, sends your confirmation, and unlocks a PII-safe public snapshot.</p>
          {result && (
            <div className="mt-8 grid gap-3 border border-white/10 bg-white/5 p-5 font-mono text-xs uppercase tracking-[0.12em] text-white/55">
              <div className="flex justify-between gap-4"><span>AI brief</span><strong className="text-[#17e86f]">Auto-generated</strong></div>
              <div className="flex justify-between gap-4"><span>Public URL</span><strong className="text-[#17e86f]">PII stripped</strong></div>
              <div className="flex justify-between gap-4"><span>Credex reach-out</span><strong className="text-[#17e86f]">High-savings cases</strong></div>
            </div>
          )}
        </div>
        <form onSubmit={captureLead} className="grid content-center gap-4 p-6 lg:p-12" aria-label="AI follow-up details">
          <input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} className="hidden" aria-hidden="true" name="website" />
          <label className="field-label text-white/60">
            <span className="flex items-center justify-between gap-3">
              <span>1. Email address</span>
              <span className="text-[#17e86f]">required</span>
            </span>
            <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="field-input bg-white text-black" placeholder="you@company.com" autoComplete="email" />
          </label>
          <label className="field-label text-white/60">
            <span className="flex items-center justify-between gap-3">
              <span>2. Company name</span>
              <span className="text-white/35">optional</span>
            </span>
            <input value={company} onChange={(event) => setCompany(event.target.value)} className="field-input bg-white text-black" placeholder="Acme AI Ops" autoComplete="organization" />
          </label>
          <label className="field-label text-white/60">
            <span className="flex items-center justify-between gap-3">
              <span>3. Your role</span>
              <span className="text-white/35">optional</span>
            </span>
            <input value={role} onChange={(event) => setRole(event.target.value)} className="field-input bg-white text-black" placeholder="Founder, Finance, Ops" autoComplete="organization-title" />
          </label>
          <label className="field-label text-white/60">
            <span className="flex items-center justify-between gap-3">
              <span>4. Team size</span>
              <span className="text-white/35">optional</span>
            </span>
            <input type="number" min="1" inputMode="numeric" value={leadTeamSize} onChange={(event) => setLeadTeamSize(event.target.value)} className="field-input bg-white text-black" placeholder="Example: 12" />
          </label>
          <button type="submit" className="button-light" disabled={!result || status === "loading"}>{status === "loading" ? "Writing brief..." : "Email me the audit →"}</button>
        </form>
      </section>
    </main>
  );
}
