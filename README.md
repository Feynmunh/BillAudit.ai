# BillAudit.ai

BillAudit.ai is a full-stack Next.js application for auditing AI-tool spend before renewal. The React frontend collects spend inputs and renders instant savings, while same-origin `/api/*` routes handle audit execution, lead capture, share data, Drizzle/Supabase Postgres persistence, Gemini summaries, and Resend email. Local development can still run through the custom Express server, while Vercel uses native Next route handlers.

## Screenshots / video

- Screenshot: pending final capture after deployment.
- Demo video: pending final recording after deployment.
- Local preview: run `npm run dev`, then open `http://localhost:3000`.

## Quick start

Requires Node.js 20+.

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

Required environment variables for persistence, Gemini summaries, and transactional email:

```bash
DATABASE_URL=postgresql://...
GEMINI_API_KEY=
# or GOOGLE_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
RESEND_API_KEY=
EMAIL_FROM=BillAudit <onboarding@resend.dev>
NEXT_PUBLIC_CREDEX_BOOKING_URL=https://...
PORT=3000
```

`DATABASE_URL` should be a server-only Supabase Postgres connection string. Drizzle ORM manages the `audits` and `leads` schema through `npm run db:push`, `npm run db:generate`, and `npm run db:migrate`. Gemini powers audit summaries and internal lead briefs when `GEMINI_API_KEY` or `GOOGLE_API_KEY` is configured; otherwise deterministic summaries are returned. `RESEND_API_KEY` sends audit confirmation emails to the user-entered lead email; `EMAIL_FROM` must be a verified Resend sender/domain. `NEXT_PUBLIC_CREDEX_BOOKING_URL` is optional and powers the high-savings Credex consultation CTA; without it, the CTA falls back to a prefilled email link.

## Current product surface

- Custom, hand-built UI only; no shadcn/ui dependency.
- Compact spend-audit form with logo-only active AI-tool tabs and an add-tool picker.
- Black-and-green brutalist rectangular buttons retained, with a lighter overall layout.
- Supported spend inputs include Cursor, Windsurf, GitHub Copilot, Claude, ChatGPT, Anthropic API, Gemini, OpenAI API, Perplexity, Midjourney, and Runway, backed by local logo assets where available.
- Client API calls use same-origin paths such as `/api/audit/calculate`, so local and Vercel deployments do not depend on `NEXT_PUBLIC_API_URL`.

## Decisions

1. **Unified Next app over separate services**: The project started with a FastAPI backend, then moved to a single TypeScript app to reduce context switching and keep frontend/backend contracts in one package. The trade-off is less framework separation, but faster iteration for an MVP.
2. **Same-origin API routes under `/api/*`**: Express originally shadowed `/` and `/audit/:auditId`; the final architecture lets Next own pages and exposes API endpoints under `/api/*`. Native route handlers keep Vercel compatible, while the local Express server keeps one-port local development.
3. **Zod schemas over TypeScript interfaces alone**: Interfaces disappear at runtime, so Zod validates untrusted request bodies before audit math runs. The trade-off is more schema code, but stronger API safety.
4. **Conservative API-spend recommendations**: Usage-based API tools intentionally do not produce savings without token-volume inputs. This avoids false-positive savings at the cost of fewer flashy recommendations.
5. **Drizzle over Supabase Postgres**: Audits and leads persist through Drizzle ORM using the Supabase Postgres connection string. This keeps public audit URLs durable while avoiding direct Supabase client APIs.

## Project structure

- `app/` - Next App Router pages, React UI, and Vercel-compatible API route handlers.
- `server/` - Shared Zod models, audit engine, local Express API, Drizzle schema/storage, pricing data, Gemini summary service, and Resend email service.
- `public/tool-logos/` - Local SVG logo assets used by the audit form.
- `docs/` - Architecture, Supabase schema, devlog, economics, GTM, pricing, prompts, reflection, and tests documentation.
