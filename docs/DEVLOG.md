# Devlog

## Day 1

**Hours worked:** 5

**What I did:** Created the first audit data model, pricing seed data, and savings logic. Added tests for obvious overspend, aligned spend, annual billing normalization, usage-based API spend, high savings thresholds, unknown tools, and duplicate tools.

**What I learned:** The most important product rule is avoiding false savings; usage-based API tools need token-volume inputs before recommending cheaper spend.

**Blockers:** Pricing source verification is still incomplete for public launch quality.

**Plan for tomorrow:** Build the API layer and connect the audit engine to a UI.

## Day 2

**Hours worked:** 6

**What I did:** Built the first backend API, storage flow, public audit view, and lead capture path. Added Supabase persistence for audit and lead records.

**What I learned:** A share page needs a separate public view model so email, company, and role data never leak into public output.

**Blockers:** Supabase tables still need deployment provisioning.

**Plan for tomorrow:** Create the frontend experience and make the audit usable without a login gate.

## Day 3

**Hours worked:** 7

**What I did:** Replaced the default Next page with a custom React UI for spend input, instant audit results, lead capture, and public sharing. Avoided shadcn/ui and built the interface by hand.

**What I learned:** Brutalist buttons can work without making the whole UI heavy; the surrounding layout needs restraint.

**Blockers:** The first hero visual was too visually complex.

**Plan for tomorrow:** Polish the UI and remove inconsistent rounded elements.

## Day 4

**Hours worked:** 4

**What I did:** Simplified the hero graphic, restored square brutalist buttons, made the top bar green, and removed curved corners from Spend Input, Audit Dashboard, and Lead Capture areas.

**What I learned:** Consistency matters more than decorative detail when a page has a strong visual language.

**Blockers:** TypeScript LSP diagnostics were unavailable in the local agent environment because `typescript-language-server` was not installed.

**Plan for tomorrow:** Strengthen engineering documentation and architecture notes.

## Day 5

**Hours worked:** 3

**What I did:** Added architecture documentation and mapped the system flow across frontend, backend logic, storage, and optional Gemini summaries.

**What I learned:** The documentation needs to track pivots immediately; stale FastAPI references became misleading after the TypeScript migration.

**Blockers:** `TESTS.md` and `PROMPTS.md` were missing and had to be created.

**Plan for tomorrow:** Migrate the backend to the final unified TypeScript architecture.

## Day 6

**Hours worked:** 8

**What I did:** Migrated the Python/FastAPI backend logic into the same Next project as an Express backend server. Replaced Pydantic with Zod schemas, moved audit math into pure TypeScript, kept Supabase and Gemini optional, moved the app from `frontend/` to the repo root, and removed the old `backend/` and `frontend/` folders.

**What I learned:** One-port full-stack architecture needs clear route ownership. Express initially shadowed `/` and `/share/:auditId`; the fix was to let Next own pages and move backend routes to `/api/*`.

**Blockers:** A generated `dist-server/` folder was unwanted and removed by switching the server TypeScript check to `noEmit`.

**Plan for tomorrow:** Re-run end-to-end QA, capture screenshots/video, and finish pricing verification.

## Day 7

**Hours worked:** 2

**What I did:** Updated mandatory documentation for the final architecture, tests, prompts, pricing assumptions, and reflection. Verified the app with lint, build, tests, and same-port API checks.

## Day 8

**Hours worked:** 2

**What I did:** Enforced Supabase as the required database provider, kept Gemini as the only LLM provider, added `/api/audit/calculate`, added the public `/audit/:uuid` route, and documented the Supabase `audits` and `leads` schema.

**What I learned:** Provider requirements should be encoded in both runtime configuration and documentation; optional fallback language can contradict production architecture.

**Blockers:** Full Supabase integration QA requires real `SUPABASE_URL` and server-side secret/service-role credentials.

**Plan for tomorrow:** Run against the production Supabase project, capture final screenshots, and add a disposable Supabase integration test path.

**What I learned:** The strongest architecture for this MVP is not “frontend plus backend service”; it is one Next application with React pages and an Express API namespace.

**Blockers:** Screenshots/video links are still pending final capture. Pricing still needs a final live vendor recheck before public submission.

**Plan for tomorrow:** Add deployment links, screenshots, and final source verification dates after production deployment.
