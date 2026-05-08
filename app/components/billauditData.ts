import type { AuditResult, UseCase } from "../../server/models";

export type BillingCycle = "monthly" | "annual";
export type SavingsLevel = AuditResult["savings_level"];
export type Status = "idle" | "loading" | "error" | "sent";
export type FormSubmitHandler = (event: { preventDefault: () => void }) => Promise<void>;

export type ToolConfig = {
  id: string;
  name: string;
  category: string;
  accent: string;
  logoSrc: string;
  logoColor: string;
  defaultPlan: string;
  plans: string[];
};

export type ToolSpend = {
  toolId: string;
  enabled: boolean;
  currentPlan: string;
  monthlySpend: string;
  annualSpend: string;
  billingCycle: BillingCycle;
  teamSize: string;
};

export type SavedSpendForm = {
  version: 2;
  form: ToolSpend[];
  teamSize: string;
  useCase: UseCase;
};

export type LevelCopy = { label: string; title: string; body: string };

export const useCaseOptions: Array<{ value: UseCase; label: string }> = [
  { value: "coding", label: "Coding" },
  { value: "writing", label: "Writing" },
  { value: "data", label: "Data" },
  { value: "research", label: "Research" },
  { value: "mixed", label: "Mixed" },
];

export const tools: ToolConfig[] = [
  { id: "cursor", name: "Cursor", category: "Coding", accent: "#19e272", logoSrc: "/tool-logos/cursor.svg", logoColor: "#111111", defaultPlan: "Pro", plans: ["Hobby", "Pro", "Business", "Enterprise"] },
  { id: "github_copilot", name: "GitHub Copilot", category: "Coding", accent: "#7c3cff", logoSrc: "/tool-logos/github-copilot.svg", logoColor: "#111111", defaultPlan: "Business", plans: ["Individual", "Business", "Enterprise"] },
  { id: "claude", name: "Claude", category: "Chat", accent: "#ff6b2b", logoSrc: "/tool-logos/claude.svg", logoColor: "#d97757", defaultPlan: "Pro", plans: ["Free", "Pro", "Max", "Team", "Enterprise", "API direct"] },
  { id: "chatgpt", name: "ChatGPT", category: "Chat", accent: "#0ea5e9", logoSrc: "/tool-logos/chatgpt.svg", logoColor: "#10a37f", defaultPlan: "Team", plans: ["Plus", "Team", "Enterprise", "API direct"] },
  { id: "anthropic_api", name: "Anthropic API", category: "API", accent: "#ff8bd2", logoSrc: "/tool-logos/anthropic.svg", logoColor: "#191919", defaultPlan: "API direct", plans: ["API direct"] },
  { id: "openai_api", name: "OpenAI API", category: "API", accent: "#f97316", logoSrc: "/tool-logos/openai.svg", logoColor: "#111111", defaultPlan: "API direct", plans: ["API direct"] },
  { id: "gemini", name: "Gemini", category: "Chat", accent: "#f6d743", logoSrc: "/tool-logos/gemini.svg", logoColor: "#4285f4", defaultPlan: "Pro", plans: ["Pro", "Ultra", "API"] },
  { id: "windsurf", name: "Windsurf", category: "Coding", accent: "#10b981", logoSrc: "/tool-logos/windsurf.svg", logoColor: "#111111", defaultPlan: "Pro", plans: ["Pro", "Teams", "Enterprise"] },
];

export const emptyForm: ToolSpend[] = tools.map((tool) => ({
  toolId: tool.id,
  enabled: tool.id === "cursor" || tool.id === "chatgpt",
  currentPlan: tool.defaultPlan,
  monthlySpend: tool.id === "cursor" ? "80" : tool.id === "chatgpt" ? "30" : "0",
  annualSpend: "",
  billingCycle: "monthly" as BillingCycle,
  teamSize: "1",
}));

export const storageKey = "billaudit.spend-form.v2";
export const legacyStorageKey = "billaudit.spend-form.v1";

export function currency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function numeric(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function normalizeForm(saved: ToolSpend[]): ToolSpend[] {
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

export function isUseCase(value: unknown): value is UseCase {
  return typeof value === "string" && useCaseOptions.some((option) => option.value === value);
}

export function isSavedSpendForm(value: unknown): value is SavedSpendForm {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<SavedSpendForm>;
  return Array.isArray(candidate.form) && typeof candidate.teamSize === "string" && isUseCase(candidate.useCase);
}

export function levelCopy(level: SavingsLevel): LevelCopy {
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
