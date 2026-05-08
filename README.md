# BillAudit.ai

BillAudit.ai is a full-stack Next.js application for auditing AI-tool spend before renewal. The React frontend collects spend inputs and renders instant savings, while the Express backend runs on the same Next server under `/api/*` for audit execution, lead capture, share data, Drizzle/Postgres persistence, and optional Gemini summaries.

## Screenshots / video

- Screenshot: pending final capture after deployment.
- Demo video: pending final recording after deployment.
- Local preview: run `npm run dev`, then open `http://localhost:3000`.

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Useful commands:

```bash
npm run test   # Vitest audit-engine tests
npm run lint   # ESLint
npm run build  # Next build + Express TypeScript check
npm run start  # production-mode unified Next + Express server
```

Required environment variables for persistence, Gemini summaries, and optional transactional email:

```bash
DATABASE_URL=postgresql://...
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
RESEND_API_KEY=
EMAIL_FROM=BillAudit <onboarding@resend.dev>
PORT=3000
```

`DATABASE_URL` should be a server-only Supabase Postgres connection string. Drizzle ORM manages the `audits` and `leads` schema. Gemini powers audit summaries and internal lead briefs. `RESEND_API_KEY` sends audit confirmation emails; when missing, lead capture still stores the lead and returns `email_status: "skipped"` for local development.

## Decisions

1. **Unified Next + Express server over separate services**: The project started with a FastAPI backend, then moved to a single TypeScript app to reduce context switching and keep frontend/backend contracts in one package. The trade-off is less framework separation, but faster iteration for an MVP.
2. **Express API namespaced under `/api/*`**: Express originally shadowed `/` and `/share/:auditId`; the final architecture lets Next own pages while Express owns API endpoints. This avoids route conflicts while keeping one port.
3. **Zod schemas over TypeScript interfaces alone**: Interfaces disappear at runtime, so Zod validates untrusted request bodies before audit math runs. The trade-off is more schema code, but stronger API safety.
4. **Conservative API-spend recommendations**: Usage-based API tools intentionally do not produce savings without token-volume inputs. This avoids false-positive savings at the cost of fewer flashy recommendations.
5. **Drizzle over Supabase Postgres**: Audits and leads persist through Drizzle ORM using the Supabase Postgres connection string. This keeps public audit URLs durable while avoiding direct Supabase client APIs.

## Project structure

- `app/` - Next App Router pages and React UI.
- `server/` - Express API, Zod models, audit engine, Drizzle schema/storage, pricing data, and Gemini summary service.
- `public/` - Static assets.
- `docs/ARCHITECTURE.md`, `docs/SUPABASE_SCHEMA.md`, `docs/DEVLOG.md`, `docs/TESTS.md`, `docs/PRICING_DATA.md`, `docs/PROMPTS.md`, `docs/REFLECTION.md` - required engineering documentation.
