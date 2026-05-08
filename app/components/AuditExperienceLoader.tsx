"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";

function AuditPlaceholder() {
  return (
    <>
      <section id="audit" className="bg-[#f8f7f2] px-5 py-14 lg:px-10 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="lg:sticky lg:top-8 lg:self-start">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-black/45">Spend input</p>
            <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-[0.98] tracking-[-0.04em] lg:text-6xl">
              A cleaner way to map AI spend.
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-black/60">
              The audit form loads as you reach it so the mobile homepage stays fast.
            </p>
          </div>
          <div className="border border-black/10 bg-white p-5 shadow-[0_30px_80px_rgb(0_0_0/0.08)]" aria-busy="true">
            <div className="grid gap-3">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="h-20 border border-black/10 bg-[#f8f7f2]" />
              ))}
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
