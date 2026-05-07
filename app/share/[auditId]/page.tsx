import type { Metadata } from "next";
import Link from "next/link";

type PublicAuditView = {
  audit_id: string;
  savings_level: "high" | "moderate" | "optimal";
  total_monthly_savings: number;
  total_annual_savings: number;
  savings_percentage: number;
  created_at: string;
  tool_count: number;
};

type PageParams = {
  params: Promise<{ auditId: string }>;
};

function money(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

async function getPublicAudit(auditId: string): Promise<PublicAuditView | null> {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
    const response = await fetch(`${apiBase}/api/share/${auditId}`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as PublicAuditView;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { auditId } = await params;
  const audit = await getPublicAudit(auditId);
  const title = audit
    ? `BillAudit found ${money(audit.total_monthly_savings)}/mo in AI savings`
    : "BillAudit public AI spend audit";
  const description = audit
    ? `${audit.tool_count} AI tools audited. ${audit.savings_level} savings signal with no PII exposed.`
    : "A public, PII-safe AI spend audit snapshot.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
    },
  };
}

export default async function SharePage({ params }: PageParams) {
  const { auditId } = await params;
  const audit = await getPublicAudit(auditId);

  return (
    <main className="min-h-screen bg-[#f7f5ee] text-[#111111]">
      <nav className="flex items-center justify-between border-b border-dashed border-black/20 bg-white p-6">
        <Link href="/" className="text-3xl font-black tracking-tight">billaudit</Link>
        <Link href="/" className="button-primary">Run your audit</Link>
      </nav>
      <section className="grid min-h-[calc(100vh-88px)] place-items-center p-5">
        <div className="w-full max-w-5xl border border-dashed border-black/20 bg-white p-6 lg:p-12">
          <p className="font-mono text-sm uppercase tracking-[0.3em] text-black/45">Public snapshot · PII stripped</p>
          {audit ? (
            <div className="mt-8 grid gap-8">
              <h1 className="text-6xl font-black leading-[0.88] tracking-[-0.06em] lg:text-8xl">
                This team can save {money(audit.total_monthly_savings)} per month on AI spend.
              </h1>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="result-card">
                  <p className="font-mono text-xs uppercase tracking-[0.25em] text-black/45">Annual savings</p>
                  <p className="mt-4 text-5xl font-black">{money(audit.total_annual_savings)}</p>
                </div>
                <div className="result-card">
                  <p className="font-mono text-xs uppercase tracking-[0.25em] text-black/45">Savings tier</p>
                  <p className="mt-4 text-5xl font-black capitalize">{audit.savings_level}</p>
                </div>
                <div className="result-card">
                  <p className="font-mono text-xs uppercase tracking-[0.25em] text-black/45">Tools audited</p>
                  <p className="mt-4 text-5xl font-black">{audit.tool_count}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 grid gap-6">
              <h1 className="text-6xl font-black leading-[0.88] tracking-[-0.06em] lg:text-8xl">Audit snapshot unavailable.</h1>
              <p className="max-w-2xl text-2xl text-black/65">Start the app server or run a fresh audit to generate a shareable public result.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
