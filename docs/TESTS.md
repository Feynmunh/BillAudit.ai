# Tests

## How to run

```bash
npm run test
npm run lint
npm run build
```

`npm run test` runs Vitest tests under `server/`. `npm run build` runs the Next production build and TypeScript checks the Express server with `tsconfig.server.json`.

## Automated audit-engine tests

The audit engine has 7 automated tests in `server/auditEngine.test.ts`.

1. **Obvious overspend savings**
   - Input: Cursor Enterprise, $500/month, 1 seat.
   - Covers: tier recommendation, monthly savings, annual savings, and `moderate` savings level.
   - Expected: Pro recommendation, $480/month savings, $5,760/year savings.

2. **Published pricing alignment**
   - Input: ChatGPT Team, $90/month, 3 seats.
   - Covers: 10% tolerance rule when spend matches published per-seat pricing.
   - Expected: no savings, Team recommendation, `optimal` savings level.

3. **Annual billing normalization**
   - Input: annual spend of $240 and monthly spend of $20.
   - Covers: `calculateMonthlyCost` and `calculateAnnualCost` helpers.
   - Expected: $20/month and $240/year.

4. **Usage-based API spend guardrail**
   - Input: OpenAI API Pay-as-you-go, $700/month.
   - Covers: no false-positive savings for usage-based billing.
   - Expected: $0 savings and Pay-as-you-go recommendation.

5. **High savings threshold**
   - Input: Cursor Enterprise, $900/month, 1 seat.
   - Covers: savings tier threshold above $500/month.
   - Expected: $880/month savings and `high` savings level.

6. **Unknown tool failure**
   - Input: `unknown_vendor`.
   - Covers: fail-fast behavior for unsupported tool IDs.
   - Expected: throws `Unknown tool_id`.

7. **Duplicate tool rejection**
   - Input: two Cursor records in the same audit request.
   - Covers: Zod uniqueness validation that replaced Pydantic validation.
   - Expected: validation fails.

## Manual QA performed

Manual same-port QA was run against `http://127.0.0.1:3000`:

- `GET /` rendered the React homepage.
- `GET /api/health` returned API health JSON.
- `POST /api/audit` returned a successful audit with $480/month savings for the Cursor overspend sample.
- `GET /api/share/:auditId` returned the PII-safe public JSON.
- `GET /share/:auditId` rendered the Next public share page.

## Remaining test gaps

- Add Playwright tests for the full browser audit and lead-capture flow.
- Add Supabase integration tests with a disposable test project or mocked client.
- Add summary-service tests for Anthropic success, missing key, and failure fallback.
- Add rate-limit/security tests once rate limiting is implemented.
