# Tests

## How to run locally

```bash
npm install
export SUPABASE_URL="<project-url>"
export SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
npm run test
npm run lint
npm run build
```

- `npm run test` runs the automated Vitest suite under `server/`.
- `npm run lint` runs ESLint across the Next/React frontend and Express backend TypeScript files.
- `npm run build` runs `next build` and `tsc -p tsconfig.server.json`, so both the React app and Express server type-check.

## GitHub Actions CI

The workflow lives at `.github/workflows/ci.yml`.

It runs on pushes and pull requests to `main`:

1. `npm ci`
2. `npm run test`
3. `npm run lint`
4. `npm run build`

## Automated tests

All automated tests are in `server/auditEngine.test.ts`. The file contains 10 audit-engine tests, exceeding the minimum requirement of 5 audit-engine-specific tests.

| Filename | Test name | What it covers | How to run |
|---|---|---|---|
| `server/auditEngine.test.ts` | `calculates savings for obvious overspend` | Cursor Enterprise at $500/month for 1 seat recommends Pro, calculates $480/month savings, $5,760/year savings, and `moderate` savings level. | `npm run test` |
| `server/auditEngine.test.ts` | `marks stack optimal when published pricing matches spend` | ChatGPT Team at $90/month for 3 seats matches published per-seat pricing and produces $0 savings with `optimal` savings level. | `npm run test` |
| `server/auditEngine.test.ts` | `normalizes annual billing to monthly cost` | `calculateMonthlyCost(0, "annual", 240)` returns $20/month and `calculateAnnualCost(20, "monthly")` returns $240/year. | `npm run test` |
| `server/auditEngine.test.ts` | `does not create false positive savings for usage-based API spend` | OpenAI API Pay-as-you-go at $700/month produces $0 savings and keeps the Pay-as-you-go recommendation. | `npm run test` |
| `server/auditEngine.test.ts` | `uses high savings tier above five hundred monthly` | Cursor Enterprise at $900/month for 1 seat produces $880/month savings and `high` savings level. | `npm run test` |
| `server/auditEngine.test.ts` | `fails fast for unknown tool ids` | Unsupported `tool_id` values throw `Unknown tool_id` instead of producing misleading recommendations. | `npm run test` |
| `server/auditEngine.test.ts` | `rejects duplicate tool ids` | Zod request validation rejects duplicate tool entries in the same audit request. | `npm run test` |
| `server/auditEngine.test.ts` | `creates UUID audit ids` | Audit IDs are random UUIDs suitable for `/audit/:uuid` public pages. | `npm run test` |
| `server/auditEngine.test.ts` | `accepts a bounded use case description` | Zod accepts the optional MVP use-case field. | `npm run test` |
| `server/auditEngine.test.ts` | `flags small teams on team or enterprise plans` | Finance flags surface small-team plan mismatch warnings. | `npm run test` |

## Manual QA already performed

Manual same-port QA was run against `http://127.0.0.1:3000`:

- `GET /` rendered the React homepage.
- `GET /api/health` returned API health JSON.
- `POST /api/audit/calculate` returned a successful audit with $480/month savings for the Cursor overspend sample.
- `GET /api/share/:auditId` returned the PII-safe public JSON.
- `GET /audit/:uuid` rendered the Next public audit page.

## Remaining test gaps

- Add Playwright tests for the full browser audit and lead-capture flow.
- Add Supabase integration tests with a disposable test project.
- Add summary-service tests for Gemini success, missing key, and failure fallback.
- Add rate-limit/security tests once rate limiting is implemented.
