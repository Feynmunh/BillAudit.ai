# Reflection

## 1. What was the hardest bug?

The hardest bug was architectural rather than a single syntax error. After migrating to Express, the backend initially used the same paths as the pages, so `GET /` returned API health JSON instead of the React homepage, and `GET /share/:auditId` returned API JSON instead of the public share page. The fix was to define route ownership clearly: Next owns pages like `/` and `/share/:auditId`, while Express owns `/api/*`. That made the app a true one-port full-stack Next application instead of two services competing for routes. The lesson was that “same server” does not mean “same path namespace.” A custom server has to preserve the framework’s page routing first, then mount API routes where they cannot shadow pages.

## 2. Which decision did I reverse?

I reversed the original split-stack backend decision. The project began with a Python FastAPI backend because Pydantic and Python made the first audit engine quick to write and test. Later, I moved to a unified TypeScript stack because the frontend, backend contracts, and validation rules were changing together. Keeping all of that in one Next project reduced translation overhead and made it easier to maintain strict JSON shape compatibility. I also reversed the temporary `/server` root folder decision after deciding the app should live as one project at the repo root, not as a separate frontend folder plus separate backend folder.

## 3. What is the week-2 roadmap?

Week 2 should focus on production readiness and better financial accuracy. First, verify every price in `server/pricingData.ts` against official vendor pages and update `PRICING_DATA.md` with final dates. Second, add token-volume inputs for OpenAI and Anthropic API spend so usage-based recommendations can become more precise. Third, add Supabase schema migrations, indexes, and a deployment checklist. Fourth, capture screenshots and a short demo video for the README. Fifth, add browser-level Playwright tests for the audit flow, lead capture, and public share page. Finally, add rate limiting and structured logging for `/api/audit` and `/api/lead`.

## 4. How did AI tools help, and where did they make mistakes?

AI tools helped with code translation, migration planning, route-shape checks, and documentation structure. The best use was asking for parity analysis before migrating the audit engine so the TypeScript tests could mirror the original Python behavior. The mistakes were mostly over-building or choosing the wrong shape too early: creating a separate `/server` package before the architecture was clarified, and temporarily allowing Express to shadow Next page routes. Those errors were corrected by narrowing the architecture to one root Next app with an Express `/api/*` namespace and no generated server output folder.

## 5. Self-ratings

- **Product clarity: 8/10.** The audit loop is clear: enter spend, get savings, capture lead, share public result.
- **Technical correctness: 8/10.** The audit engine has tests and runtime validation, but pricing needs final external verification.
- **UI quality: 8/10.** The custom UI is cohesive and no longer overuses curved elements, but final screenshots are still needed.
- **Documentation: 7/10.** The required docs now match the architecture, but README media links and source verification should be completed before submission.
- **Production readiness: 6/10.** The app builds and runs locally, but deployment, rate limiting, logs, and Supabase migrations still need hardening.
