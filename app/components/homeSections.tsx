import Image from "next/image";
import { memo } from "react";
import type { AuditResult, UseCase } from "../../server/models";
import { currency, type BillingCycle, type FormSubmitHandler, type LevelCopy, type Status, type ToolConfig, type ToolSpend, useCaseOptions } from "./billauditData";

export function TopBanner() {
  return (
    <section className="border-b border-black/10 bg-[#17e86f] px-5 py-3 text-center font-mono text-xs uppercase tracking-[0.18em] text-black/80">
      Instant AI spend audit · no login required · built for Credex operators
    </section>
  );
}

export function Header() {
  return (
    <nav className="flex items-center justify-between border-b border-black/10 bg-[#f8f7f2]/90 px-5 py-5 backdrop-blur lg:px-10">
      <a href="#top" className="flex items-center" aria-label="BillAudit home">
        <Image src="/billaudit-logo-cropped.png" alt="BillAudit" width={72} height={80} className="h-14 w-auto object-contain" priority />
      </a>
      <div className="hidden items-center gap-8 font-mono text-xs uppercase tracking-[0.16em] text-black/60 md:flex">
        <a href="#audit">Audit</a>
        <a href="#results">Results</a>
        <a href="#lead">Share</a>
      </div>
      <a href="#audit" className="button-primary">Run audit</a>
    </nav>
  );
}

export function Hero() {
  return (
    <section id="top" className="grid min-h-[680px] border-b border-black/10 bg-[#f8f7f2] lg:grid-cols-[1fr_0.9fr]">
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
  );
}

export function OperatorPromises() {
  return (
    <section className="grid border-b border-black/10 bg-[#f8f7f2] md:grid-cols-3">
      {["No login gate before value", "Finance-literate recommendations", "Public audit link for sharing"].map((item) => (
        <div key={item} className="border-b border-black/10 p-6 md:border-b-0 md:border-r last:border-r-0">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.24em] text-black/40">Operator promise</p>
          <p className="mt-4 text-2xl font-medium tracking-tight">{item}</p>
        </div>
      ))}
    </section>
  );
}

type AuditSidebarProps = {
  selectedCount: number;
  declaredSpend: number;
};

function AuditSidebar({ selectedCount, declaredSpend }: AuditSidebarProps) {
  return (
    <div className="audit-copy-panel">
      <p className="font-mono text-xs uppercase tracking-[0.24em] text-white/55">Spend input</p>
      <h2 className="mt-5 max-w-3xl text-[clamp(3.2rem,6.4vw,6.8rem)] font-semibold leading-[0.93] tracking-[-0.07em] text-white">
        A cleaner way to burn before renewal.
      </h2>
      <p className="mt-7 max-w-2xl text-xl leading-[1.35] text-white/65 lg:text-2xl">
        Choose the tools you pay for, set team size and use case, then enter each plan, monthly spend, and seats.
      </p>
      <div className="audit-metric-stack">
        <div className="audit-metric-row"><span>Selected</span><strong>{selectedCount}</strong></div>
        <div className="audit-metric-row"><span>Monthly spend</span><strong>{currency(declaredSpend)}</strong></div>
        <div className="audit-metric-row"><span>Autosave</span><strong>On</strong></div>
      </div>
    </div>
  );
}

type ToolRowProps = {
  toolSpend: ToolSpend;
  config: ToolConfig;
  onChange: (next: Partial<ToolSpend>) => void;
};

const ToolRow = memo(function ToolRow({ toolSpend, config, onChange }: ToolRowProps) {
  const logoStyle = { backgroundColor: config.logoColor, WebkitMaskImage: `url(${config.logoSrc})`, maskImage: `url(${config.logoSrc})` };

  return (
    <fieldset className="tool-row">
      <label className="tool-identity">
        <input
          type="checkbox"
          className="h-4 w-4 accent-black"
          checked={toolSpend.enabled}
          onChange={(event) => onChange({ enabled: event.target.checked })}
        />
        <span className="tool-logo-frame tool-logo-frame-large">
          <span className="tool-logo-image" style={logoStyle} />
        </span>
        <span className="grid min-w-0 gap-1">
          <span className="truncate text-2xl font-semibold tracking-[-0.04em] text-black lg:text-3xl">{config.name}</span>
          <span className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-black/38">{config.category}</span>
        </span>
      </label>
      <div className="grid gap-3 md:grid-cols-[1.1fr_0.8fr_0.55fr_0.85fr]">
        <label className="field-label">
          Plan
          <select value={toolSpend.currentPlan} onChange={(event) => onChange({ currentPlan: event.target.value })} className="field-input">
            {config.plans.map((plan) => <option key={plan} value={plan}>{plan}</option>)}
          </select>
        </label>
        <label className="field-label">
          Monthly $
          <input inputMode="decimal" value={toolSpend.monthlySpend} onChange={(event) => onChange({ monthlySpend: event.target.value })} className="field-input" />
        </label>
        <label className="field-label">
          Seats
          <input inputMode="numeric" value={toolSpend.teamSize} onChange={(event) => onChange({ teamSize: event.target.value })} className="field-input" />
        </label>
        <label className="field-label">
          Billing
          <select value={toolSpend.billingCycle} onChange={(event) => onChange({ billingCycle: event.target.value as BillingCycle })} className="field-input">
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
          </select>
        </label>
      </div>
    </fieldset>
  );
});

type SpendFormProps = {
  form: ToolSpend[];
  toolsConfig: ToolConfig[];
  teamSize: string;
  useCase: UseCase;
  status: Status;
  message: string;
  selectedCount: number;
  declaredSpend: number;
  selectedToolId: string;
  onSelectToolAction: (toolId: string) => void;
  onTeamSizeChangeAction: (value: string) => void;
  onUseCaseChangeAction: (value: UseCase) => void;
  onUpdateToolAction: (toolId: string, next: Partial<ToolSpend>) => void;
  onRunAuditAction: FormSubmitHandler;
};

export function SpendInputSection({ form, toolsConfig, teamSize, useCase, status, message, selectedCount, declaredSpend, selectedToolId, onSelectToolAction, onTeamSizeChangeAction, onUseCaseChangeAction, onUpdateToolAction, onRunAuditAction }: SpendFormProps) {
  const selectedToolSpend = form.find((tool) => tool.toolId === selectedToolId) ?? form[0];
  const selectedConfig = selectedToolSpend ? toolsConfig.find((tool) => tool.id === selectedToolSpend.toolId) : undefined;
  const activeTools = toolsConfig.filter((tool) => tool.id === selectedToolSpend?.toolId || form.some((item) => item.toolId === tool.id && item.enabled));
  const addableTools = toolsConfig.filter((tool) => !activeTools.some((activeTool) => activeTool.id === tool.id));

  return (
    <section id="audit" className="audit-section">
      <div className="mx-auto grid max-w-[72rem] gap-8 px-0 sm:px-4">
        <AuditSidebar selectedCount={selectedCount} declaredSpend={declaredSpend} />
        <form onSubmit={onRunAuditAction} className="audit-console">
          <div className="audit-tabs" aria-label="AI tools">
            {activeTools.map((tool) => {
              const toolSpend = form.find((item) => item.toolId === tool.id);
              const isActive = selectedToolSpend?.toolId === tool.id;
              const logoStyle = { backgroundColor: tool.logoColor, WebkitMaskImage: `url(${tool.logoSrc})`, maskImage: `url(${tool.logoSrc})` };
              return (
                <button
                  key={tool.id}
                  type="button"
                  aria-pressed={isActive}
                  className={`audit-tab ${isActive ? "audit-tab-active" : ""}`}
                  onClick={() => {
                    onSelectToolAction(tool.id);
                    if (toolSpend && !toolSpend.enabled) {
                      onUpdateToolAction(tool.id, { enabled: true });
                    }
                  }}
                >
                  <span className="tool-logo-frame"><span className="tool-logo-image" style={logoStyle} /></span>
                  <span className="sr-only">{tool.name}</span>
                </button>
              );
            })}
            {addableTools.length > 0 && (
              <details className="audit-tool-picker">
                <summary className="audit-add-tool">+ Add AI tool</summary>
                <div className="audit-tool-menu">
                  {addableTools.map((tool) => {
                    const logoStyle = { backgroundColor: tool.logoColor, WebkitMaskImage: `url(${tool.logoSrc})`, maskImage: `url(${tool.logoSrc})` };
                    return (
                      <button
                        key={tool.id}
                        type="button"
                        className="audit-tool-menu-item"
                        onClick={() => {
                          onSelectToolAction(tool.id);
                          onUpdateToolAction(tool.id, { enabled: true });
                        }}
                      >
                        <span className="tool-logo-frame"><span className="tool-logo-image" style={logoStyle} /></span>
                        <span>{tool.name}</span>
                      </button>
                    );
                  })}
                </div>
              </details>
            )}
          </div>
          <div className="audit-detail-panel">
            <div className="audit-setup-grid">
              <label className="field-label">
                Team size
                <input inputMode="numeric" value={teamSize} onChange={(event) => onTeamSizeChangeAction(event.target.value)} className="field-input" placeholder="Example: 12" />
              </label>
              <label className="field-label">
                Primary use case
                <select value={useCase} onChange={(event) => onUseCaseChangeAction(event.target.value as UseCase)} className="field-input">
                  {useCaseOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            </div>
            {selectedToolSpend && selectedConfig && (
              <ToolRow toolSpend={selectedToolSpend} config={selectedConfig} onChange={(next) => onUpdateToolAction(selectedToolSpend.toolId, next)} />
            )}
          </div>
          <div className="audit-action-row">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-black/48">Draft autosaves across reloads.</p>
            <button type="submit" className="button-primary" disabled={status === "loading"}>
              {status === "loading" ? "Auditing..." : "Run spend audit →"}
            </button>
          </div>
          {message && <p className="mt-4 bg-red-50 p-4 font-mono text-xs uppercase tracking-[0.12em] text-red-700">{message}</p>}
        </form>
      </div>
    </section>
  );
}

type ResultsSectionProps = {
  result: AuditResult | null;
  level: LevelCopy | null;
};

const RecommendationCard = memo(function RecommendationCard({ rec }: { rec: AuditResult["tool_recommendations"][number] }) {
  return (
    <article className="grid gap-5 border border-black/10 bg-white p-5 shadow-[0_12px_40px_rgb(0_0_0/0.05)] md:grid-cols-[0.6fr_1fr_0.4fr]">
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
  );
});

export function ResultsSection({ result, level }: ResultsSectionProps) {
  return (
    <section id="results" className="border-y border-black/10 bg-[#f8f7f2] p-5 lg:p-10">
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
            {result.tool_recommendations.map((rec) => <RecommendationCard key={rec.tool_id} rec={rec} />)}
          </div>
        </div>
      )}
    </section>
  );
}

type LeadSectionProps = {
  result: AuditResult | null;
  email: string;
  company: string;
  role: string;
  leadTeamSize: string;
  website: string;
  publicUrl: string | null;
  status: Status;
  message: string;
  onEmailChangeAction: (value: string) => void;
  onCompanyChangeAction: (value: string) => void;
  onRoleChangeAction: (value: string) => void;
  onLeadTeamSizeChangeAction: (value: string) => void;
  onWebsiteChangeAction: (value: string) => void;
  onCaptureLeadAction: FormSubmitHandler;
};

const credexBookingUrl = process.env.NEXT_PUBLIC_CREDEX_BOOKING_URL ?? "mailto:hello@credex.com?subject=High-savings%20BillAudit%20consultation";

export function LeadSection({ result, email, company, role, leadTeamSize, website, publicUrl, status, message, onEmailChangeAction, onCompanyChangeAction, onRoleChangeAction, onLeadTeamSizeChangeAction, onWebsiteChangeAction, onCaptureLeadAction }: LeadSectionProps) {
  const isHighSavings = result?.savings_level === "high";

  return (
    <section id="lead" className="grid bg-[#111111] text-white lg:grid-cols-[1fr_0.8fr]">
      <div className="border-b border-white/10 p-6 lg:border-b-0 lg:border-r lg:p-12">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-white/45">AI follow-up</p>
        <h2 className="mt-4 max-w-3xl text-4xl font-medium leading-[1] tracking-[-0.04em] lg:text-6xl">Claim the clean version.</h2>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/55">Drop an email to capture the report. Gemini writes the internal Credex brief, sends your confirmation, and unlocks a PII-safe public snapshot.</p>
        {result && (
          <div className="mt-8 grid gap-3 border border-white/10 bg-white/5 p-5 font-mono text-xs uppercase tracking-[0.12em] text-white/55">
            <div className="flex justify-between gap-4"><span>AI brief</span><strong className="text-[#17e86f]">Auto-generated</strong></div>
            <div className="flex justify-between gap-4"><span>Public URL</span><strong className="text-[#17e86f]">PII stripped</strong></div>
            <div className="flex justify-between gap-4"><span>Credex consultation</span><strong className="text-[#17e86f]">{isHighSavings ? "Available now" : "If savings spike"}</strong></div>
          </div>
        )}
        {isHighSavings && (
          <a href={credexBookingUrl} className="button-light mt-6 inline-flex w-fit" target="_blank" rel="noreferrer">
            Book Credex consultation →
          </a>
        )}
      </div>
      <form onSubmit={onCaptureLeadAction} className="grid content-center gap-4 p-6 lg:p-12" aria-label="AI follow-up details">
        <input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => onWebsiteChangeAction(event.target.value)} className="hidden" aria-hidden="true" name="website" />
        <label className="field-label text-white/60">
          <span className="flex items-center justify-between gap-3">
            <span>1. Email address</span>
            <span className="text-[#17e86f]">required</span>
          </span>
          <input type="email" required value={email} onChange={(event) => onEmailChangeAction(event.target.value)} className="field-input bg-white text-black" placeholder="you@company.com" autoComplete="email" />
        </label>
        <label className="field-label text-white/60">
          <span className="flex items-center justify-between gap-3">
            <span>2. Company name</span>
            <span className="text-white/35">optional</span>
          </span>
          <input value={company} onChange={(event) => onCompanyChangeAction(event.target.value)} className="field-input bg-white text-black" placeholder="Acme AI Ops" autoComplete="organization" />
        </label>
        <label className="field-label text-white/60">
          <span className="flex items-center justify-between gap-3">
            <span>3. Your role</span>
            <span className="text-white/35">optional</span>
          </span>
          <input value={role} onChange={(event) => onRoleChangeAction(event.target.value)} className="field-input bg-white text-black" placeholder="Founder, Finance, Ops" autoComplete="organization-title" />
        </label>
        <label className="field-label text-white/60">
          <span className="flex items-center justify-between gap-3">
            <span>4. Team size</span>
            <span className="text-white/35">optional</span>
          </span>
          <input type="number" min="1" inputMode="numeric" value={leadTeamSize} onChange={(event) => onLeadTeamSizeChangeAction(event.target.value)} className="field-input bg-white text-black" placeholder="Example: 12" />
        </label>
        <button type="submit" className="button-light" disabled={!result || status === "loading"}>{status === "loading" ? "Writing brief..." : "Email me the audit →"}</button>
        {message && result && (
          <p className={`border p-4 font-mono text-xs uppercase tracking-[0.12em] ${status === "error" ? "border-red-300 bg-red-950/40 text-red-100" : "border-[#17e86f]/40 bg-[#17e86f]/10 text-[#b8ffd3]"}`}>
            {message}
          </p>
        )}
        {publicUrl && (
          <div className="grid gap-3 border border-white/10 bg-white/5 p-4">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-white/45">Shareable result URL</p>
            <a href={publicUrl} className="break-all text-lg font-semibold text-[#17e86f] underline decoration-[#17e86f]/40 underline-offset-4">
              {publicUrl}
            </a>
            <p className="text-sm leading-relaxed text-white/50">This public version shows tools and savings numbers only. Email, company, role, and team size stay private.</p>
          </div>
        )}
      </form>
    </section>
  );
}
