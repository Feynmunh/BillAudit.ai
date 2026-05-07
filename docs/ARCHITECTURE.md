# BillAudit architecture

BillAudit is a full-stack Next.js application. Next renders the React frontend pages, and a custom Express server mounted in the same app serves backend API routes under `/api/*` on the same port.

## System diagram

```mermaid
flowchart LR
    User["Operator in browser"]

    subgraph App["One Next.js application on :3000"]
        ReactUI["React UI<br/>app/page.tsx"]
        ShareUI["Share page<br/>app/share/[auditId]/page.tsx"]
        LocalDraft["localStorage<br/>billaudit.spend-form.v1"]
        Express["Express API<br/>server/index.ts + server/api.ts"]
        Engine["Pure TS audit engine<br/>server/auditEngine.ts"]
        Pricing["Typed pricing seed data<br/>server/pricingData.ts"]
        Schemas["Zod request schemas<br/>server/models.ts"]
        Summary["Anthropic/fallback summaries<br/>server/summaryService.ts"]
        Store["AuditStore<br/>server/storage.ts"]
    end

    subgraph Data["Persistence and external services"]
        Supabase["Supabase<br/>audit_results + leads"]
        Memory["In-memory fallback"]
        Anthropic["Anthropic Messages API"]
    end

    User --> ReactUI
    User --> ShareUI
    ReactUI <--> LocalDraft
    ReactUI -- "POST /api/audit" --> Express
    ReactUI -- "POST /api/lead" --> Express
    ShareUI -- "GET /api/share/{auditId}" --> Express
    Express --> Schemas
    Express --> Engine
    Engine --> Pricing
    Express --> Summary
    Summary -. "ANTHROPIC_API_KEY present" .-> Anthropic
    Express --> Store
    Store -- "SUPABASE_URL + key present" --> Supabase
    Store -. "env vars missing" .-> Memory
    Store --> Engine
```

## Data flow

1. The user opens `/`, which is rendered by Next and React from `app/page.tsx`.
2. Spend inputs are autosaved in browser `localStorage` under `billaudit.spend-form.v1`.
3. Clicking “Run spend audit” sends `POST /api/audit` to the Express router on the same server.
4. Zod validates the audit request: 1-20 tools, unique `tool_id`, team size bounds, billing cycle, non-negative spend, and maximum monthly spend.
5. `server/auditEngine.ts` computes normalized monthly spend, tier matching, recommended plan, savings, annual totals, savings percentage, and fallback summary.
6. `server/summaryService.ts` uses Anthropic only when `ANTHROPIC_API_KEY` exists; otherwise it returns the deterministic fallback summary.
7. `server/storage.ts` stores the audit in memory and also upserts to Supabase when configured.
8. Lead capture sends `POST /api/lead`; the lead is stored in memory and optionally inserted into Supabase `leads`.
9. Public share pages render at `/share/:auditId`; the server page fetches `GET /api/share/:auditId`, which strips PII and returns aggregate audit data only.

## Stack justification

- **Next.js + React**: keeps the UI, public share route, metadata, and Open Graph rendering in one App Router project.
- **Express inside the Next server**: gives explicit backend route control without running a separate backend port or Python service.
- **TypeScript + Zod**: replaces Pydantic with compile-time types plus runtime validation for untrusted JSON.
- **Decimal.js**: keeps financial math deterministic and avoids ordinary JavaScript floating-point surprises.
- **Supabase**: provides a hosted database path for audits and leads while keeping local development lightweight through memory fallback.
- **Anthropic SDK**: enables optional executive summaries without making LLM availability a hard dependency.

## API surface

- `GET /api/health` - service health.
- `GET /api/tools` - supported tools and tier names/prices.
- `POST /api/audit` - validated audit request, audit result response.
- `GET /api/audit/:auditId` - saved full audit result.
- `GET /api/share/:auditId` - PII-safe public audit view.
- `POST /api/lead` - lead capture.

## Scalability plan for 10k audits/day

10k audits/day is roughly 7 audits/minute on average, with higher bursts during demos or campaigns. The current app can handle that in a small deployment if Supabase is configured, but these changes would harden it:

1. **Persist every audit in Supabase** and disable reliance on in-memory storage outside local development.
2. **Add indexes** on `audit_results.audit_id`, `audit_results.created_at`, and `leads.audit_id`.
3. **Move Anthropic summaries to a queue** if p95 latency or rate limits become a problem; return fallback immediately and update `ai_summary` asynchronously.
4. **Cache `/api/tools`** because pricing seed data is static during a deployment.
5. **Add rate limiting** for `/api/audit` and `/api/lead` by IP/session to protect spend and prevent spam.
6. **Add structured logs and metrics** for audit count, validation failures, Supabase errors, and LLM fallback rate.
7. **Run multiple app instances** behind the hosting provider’s load balancer; memory fallback should be treated as local-only because instance memory is not shared.
