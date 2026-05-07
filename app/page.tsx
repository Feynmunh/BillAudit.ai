"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type BillingCycle = "monthly" | "annual";
type SavingsLevel = "high" | "moderate" | "optimal";

type ToolConfig = {
  id: string;
  name: string;
  category: string;
  accent: string;
  defaultPlan: string;
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

type ToolRecommendation = {
  tool_id: string;
  current_plan: string;
  current_monthly_spend: number;
  recommended_plan: string;
  recommended_monthly_spend: number;
  monthly_savings: number;
  annual_savings: number;
  savings_percentage: number;
  reasoning: string;
  alternative_tools: string[] | null;
};

type AuditResult = {
  audit_id: string;
  created_at: string;
  total_monthly_spend: number;
  total_annual_spend: number;
  total_monthly_savings: number;
  total_annual_savings: number;
  savings_level: SavingsLevel;
  tool_recommendations: ToolRecommendation[];
  summary: string | null;
  ai_summary: string | null;
};

type AuditResponse = {
  success: boolean;
  data?: AuditResult;
  error?: string;
};

const tools: ToolConfig[] = [
  { id: "cursor", name: "Cursor", category: "Coding", accent: "#19e272", defaultPlan: "Pro" },
  { id: "github_copilot", name: "Copilot", category: "Coding", accent: "#7c3cff", defaultPlan: "Business" },
  { id: "claude", name: "Claude", category: "Chat", accent: "#ff6b2b", defaultPlan: "Pro" },
  { id: "chatgpt", name: "ChatGPT", category: "Chat", accent: "#0ea5e9", defaultPlan: "Team" },
  { id: "gemini", name: "Gemini", category: "Chat", accent: "#f6d743", defaultPlan: "Advanced" },
  { id: "openai_api", name: "API Spend", category: "API", accent: "#ff8bd2", defaultPlan: "Pay-as-you-go" },
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

const storageKey = "billaudit.spend-form.v1";

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
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "sent">("idle");
  const [message, setMessage] = useState("");
  const formLoaded = useRef(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        try {
          setForm(JSON.parse(saved) as ToolSpend[]);
        } catch {
          window.localStorage.removeItem(storageKey);
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
    window.localStorage.setItem(storageKey, JSON.stringify(form));
  }, [form]);

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

    const payload = {
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
      team_size: 1,
      include_alternatives: true,
    };

    if (payload.tools.length === 0) {
      setStatus("error");
      setMessage("Select at least one tool to audit.");
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, company: company || null, audit_id: result.audit_id }),
      });
      if (!response.ok) {
        throw new Error("Lead capture failed.");
      }
      setStatus("sent");
      setMessage(`Public audit URL reserved: /share/${result.audit_id}`);
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
              Choose the tools you pay for, enter the current plan and monthly spend, then run the audit.
            </p>
            <div className="mt-8 grid gap-3 font-mono text-xs uppercase tracking-[0.12em]">
              <div className="metric-row"><span>Selected</span><strong>{selectedCount}</strong></div>
              <div className="metric-row"><span>Monthly spend</span><strong>{currency(declaredSpend)}</strong></div>
              <div className="metric-row"><span>Autosave</span><strong>On</strong></div>
            </div>
          </div>

          <form onSubmit={runAudit} className="border border-black/10 bg-white p-4 shadow-[0_30px_80px_rgb(0_0_0/0.08)] lg:p-5">
            <div className="grid gap-3">
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
                        <input value={toolSpend.currentPlan} onChange={(event) => updateTool(toolSpend.toolId, { currentPlan: event.target.value })} className="field-input" />
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
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-white/45">Lead capture</p>
          <h2 className="mt-4 max-w-3xl text-4xl font-medium leading-[1] tracking-[-0.04em] lg:text-6xl">Turn the audit into a public signal.</h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/55">Capture the benchmark export and reserve a PII-safe share link after the savings value is visible.</p>
        </div>
        <form onSubmit={captureLead} className="grid content-center gap-4 p-6 lg:p-12">
          <label className="field-label text-white/60">
            Work email
            <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="field-input bg-white text-black" />
          </label>
          <label className="field-label text-white/60">
            Company
            <input value={company} onChange={(event) => setCompany(event.target.value)} className="field-input bg-white text-black" />
          </label>
          <button type="submit" className="button-light" disabled={!result || status === "loading"}>Send benchmark + share URL →</button>
        </form>
      </section>
    </main>
  );
}
