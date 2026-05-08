"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";

function AuditPlaceholder() {
  return (
    <>
      <section id="audit" className="audit-section">
        <div className="mx-auto grid max-w-[96rem] gap-12">
          <div className="audit-copy-panel">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-white/55">Spend input</p>
            <h2 className="mt-5 max-w-3xl text-[clamp(3.2rem,6.4vw,6.8rem)] font-semibold leading-[0.93] tracking-[-0.07em] text-white">
              A cleaner way to burn before renewal.
            </h2>
            <p className="mt-7 max-w-2xl text-xl leading-[1.35] text-white/65 lg:text-2xl">
              The audit form loads as you reach it so the mobile homepage stays fast.
            </p>
            <div className="audit-metric-stack">
              <div className="audit-metric-row"><span>Selected</span><strong>2</strong></div>
              <div className="audit-metric-row"><span>Monthly spend</span><strong>$110</strong></div>
              <div className="audit-metric-row"><span>Autosave</span><strong>On</strong></div>
            </div>
          </div>
          <div className="audit-console" aria-busy="true">
            <div className="audit-tabs">
              {Array.from({ length: 8 }, (_, index) => (
                <div key={index} className="audit-tab h-20" />
              ))}
            </div>
            <div className="audit-detail-panel">
              <div className="h-28 border border-black/10 bg-[#fffde8]" />
              <div className="grid gap-3 md:grid-cols-4">
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index} className="h-20 border border-black/10 bg-[#fbfaf7]" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="results" className="border-y border-black/10 bg-white p-5 lg:p-10">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-black/45">Audit dashboard</p>
        <h2 className="mt-3 text-4xl font-semibold tracking-[-0.04em] lg:text-6xl">Savings signal.</h2>
      </section>
      <section id="lead" className="bg-[#111111] p-6 text-white lg:p-12">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-white/45">AI follow-up</p>
        <h2 className="mt-4 max-w-3xl text-4xl font-medium leading-[1] tracking-[-0.04em] lg:text-6xl">Claim the clean version.</h2>
      </section>
    </>
  );
}

export function AuditExperienceLoader() {
  const [AuditExperience, setAuditExperience] = useState<ComponentType | null>(null);
  const markerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const loadAudit = () => {
      void import("./AuditExperience").then((module) => {
        if (!cancelled) {
          setAuditExperience(() => module.AuditExperience);
        }
      });
    };

    const marker = markerRef.current;
    if (!marker || !("IntersectionObserver" in window)) {
      window.setTimeout(loadAudit, 1_200);
      return () => {
        cancelled = true;
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          loadAudit();
        }
      },
      { rootMargin: "700px 0px" }
    );

    observer.observe(marker);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, []);

  if (AuditExperience) {
    return <AuditExperience />;
  }

  return (
    <div ref={markerRef}>
      <AuditPlaceholder />
    </div>
  );
}
