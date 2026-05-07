# BillAudit.ai

BillAudit.ai is a full-stack Next.js application for auditing AI-tool spend before renewal. The React frontend collects spend inputs and renders instant savings, while the Express backend runs on the same Next server under `/api/*` for audit execution, lead capture, share data, Supabase persistence, and optional Anthropic summaries.

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

Optional environment variables:

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-3-5-haiku-latest
PORT=3000
```

If Supabase keys are missing, the app uses in-memory storage. If Anthropic keys are missing or fail, the app returns the deterministic fallback summary.

## Decisions

1. **Unified Next + Express server over separate services**: The project started with a FastAPI backend, then moved to a single TypeScript app to reduce context switching and keep frontend/backend contracts in one package. The trade-off is less framework separation, but faster iteration for an MVP.
2. **Express API namespaced under `/api/*`**: Express originally shadowed `/` and `/share/:auditId`; the final architecture lets Next own pages while Express owns API endpoints. This avoids route conflicts while keeping one port.
3. **Zod schemas over TypeScript interfaces alone**: Interfaces disappear at runtime, so Zod validates untrusted request bodies before audit math runs. The trade-off is more schema code, but stronger API safety.
4. **Conservative API-spend recommendations**: Usage-based OpenAI and Anthropic API tools intentionally do not produce savings without token-volume inputs. This avoids false-positive savings at the cost of fewer flashy recommendations.
5. **Supabase optional with in-memory fallback**: Local development works with no database setup, while deployed environments can persist audits and leads. The trade-off is that local share links disappear on restart unless Supabase is configured.

## Project structure

- `app/` - Next App Router pages and React UI.
- `server/` - Express API, Zod models, audit engine, pricing data, storage, and Anthropic summary service.
- `public/` - Static assets.
- `docs/ARCHITECTURE.md`, `docs/DEVLOG.md`, `docs/TESTS.md`, `docs/PRICING_DATA.md`, `docs/PROMPTS.md`, `docs/REFLECTION.md` - required engineering documentation.
