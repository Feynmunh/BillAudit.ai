import type { Metadata } from "next";
import Link from "next/link";

import type { PublicAuditView } from "@/server/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageParams = {
  params: Promise<{ uuid: string }>;
};

function money(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

async function getPublicAudit(uuid: string): Promise<PublicAuditView | null> {
  try {
    const { AuditStore } = await import("@/server/storage");
    return await new AuditStore().getPublicAudit(uuid);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { uuid } = await params;
  const audit = await getPublicAudit(uuid);
  const title = audit
    ? `BillAudit found ${money(audit.total_monthly_savings)}/mo in AI savings`
    : "BillAudit public AI spend audit";
  const description = audit
    ? `${audit.tool_count} AI tools audited. ${audit.savings_level} savings signal with no PII exposed.`
    : "A public, PII-safe AI spend audit snapshot.";

  return {
    title,
    description,
    alternates: {
      canonical: `/audit/${uuid}`,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: `/audit/${uuid}`,
      images: [
        {
          url: `/audit/${uuid}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: "BillAudit public AI spend audit snapshot",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/audit/${uuid}/opengraph-image`],
    },
  };
}

export default async function AuditPage({ params }: PageParams) {
  const { uuid } = await params;
  const audit = await getPublicAudit(uuid);

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
                {money(audit.total_monthly_savings)}/mo found in this AI stack.
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
              <div className="grid gap-3">
                {audit.tools.map((tool) => (
                  <article key={tool.tool_id} className="grid gap-4 border border-black/10 bg-[#f7f5ee] p-5 md:grid-cols-[0.5fr_0.8fr_0.4fr]">
                    <div>
                      <p className="font-mono text-xs uppercase tracking-[0.25em] text-black/45">Tool</p>
                      <h2 className="mt-2 text-3xl font-black capitalize tracking-tight">{tool.tool_id.replaceAll("_", " ")}</h2>
                    </div>
                    <p className="text-xl text-black/65">{tool.current_plan} → {tool.recommended_plan}</p>
                    <div className="md:text-right">
                      <p className="font-mono text-xs uppercase tracking-[0.25em] text-black/45">Save/mo</p>
                      <p className="text-3xl font-black text-[#13b95a]">{money(tool.monthly_savings)}</p>
                    </div>
                  </article>
                ))}
              </div>
              <div className="border border-black bg-[#17e86f] p-6 text-black">
                <p className="font-mono text-xs uppercase tracking-[0.25em]">Share loop</p>
                <p className="mt-3 text-3xl font-black tracking-tight">No email. No company. Just tools, savings, and the benchmark.</p>
              </div>
              {audit.savings_level === "high" && (
                <div className="grid gap-4 border border-black bg-black p-6 text-white md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#17e86f]">High-savings case</p>
                    <p className="mt-3 text-3xl font-black tracking-tight">Credex can help turn this benchmark into renewal leverage.</p>
                  </div>
                  <Link href="/?consultation=credex#audit" className="button-light">Run yours + book →</Link>
                </div>
              )}
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
