# Pricing data

Pricing seed data is stored in `server/pricingData.ts` as typed `ToolPricing` and `PricingTier` records. The audit engine treats these as product assumptions and uses monthly price as the canonical comparison basis.

## Source table

| Tool | Numbers used in code | Official source URL | Verification date | Notes |
|---|---:|---|---|---|
| Cursor | Pro $20/mo, $192/yr; Business $40/mo, $384/yr; Enterprise seed $80/mo, $768/yr | https://cursor.com/pricing | 2026-05-08 | Enterprise is a seed estimate and must be rechecked before public launch. |
| GitHub Copilot | Individual $10/mo, $100/yr; Business $19/mo, $190/yr; Enterprise $39/mo, $390/yr | https://github.com/features/copilot#pricing | 2026-05-08 | Per-seat pricing. |
| Claude | Pro $20/mo, $200/yr; Team $30/mo, $300/yr | https://www.anthropic.com/pricing | 2026-05-08 | Consumer/team plan seed data. |
| ChatGPT | Plus $20/mo, $199/yr; Team $30/mo, $299/yr; Enterprise seed $60/mo, $599/yr | https://openai.com/chatgpt/pricing/ | 2026-05-08 | Enterprise is a seed estimate and must be rechecked before public launch. |
| Gemini | Advanced $19.99/mo, $199.99/yr; Business $30/mo, $300/yr | https://workspace.google.com/solutions/ai/ | 2026-05-08 | Workspace business plan pricing may vary by region and billing term. |
| OpenAI API | GPT-4o $5/1M input tokens, $15/1M output tokens; GPT-4o mini $0.15/$0.60 per 1M tokens | https://openai.com/api/pricing/ | 2026-05-08 | The audit engine does not infer savings without token-volume inputs. |
| Anthropic API | API direct $0 platform baseline | https://www.anthropic.com/pricing | 2026-05-08 | Included for spend visibility; usage-based savings stay conservative without token-volume inputs. |
| Windsurf | Pro $15/mo, $144/yr; Teams $30/mo, $300/yr; Enterprise seed $60/mo, $600/yr | https://windsurf.com/pricing | 2026-05-08 | Included for the current UI/tool set; final vendor recheck required before public launch. |
| Perplexity | Pro $20/mo, $200/yr; Enterprise seed $50/mo, $500/yr | https://www.perplexity.ai/pro | 2026-05-08 | Enterprise is a seed estimate and must be rechecked before public launch. |
| Midjourney | Basic $10/mo, $96/yr; Standard $30/mo, $288/yr; Pro $60/mo, $576/yr; Mega $120/mo, $1152/yr | https://docs.midjourney.com/docs/plans | 2026-05-08 | GPU-hour limits are included as plan context. |
| Runway | Standard $12/mo, $132/yr; Unlimited $28/mo, $308/yr; Enterprise seed $75/mo, $825/yr | https://runwayml.com/pricing | 2026-05-08 | Enterprise is a seed estimate and must be rechecked before public launch. |

## Maintenance rules

- Every number in `server/pricingData.ts` must be traceable to this file.
- Final submission should include a fresh manual recheck of each official pricing page.
- API usage-based tools must not produce savings without token-volume or usage inputs.
- Annual spend is normalized to monthly spend before scoring.
- Public share routes must never expose user email, company, or role.
- Local logo assets live in `public/tool-logos/`; pricing changes should keep tool IDs aligned with the spend-audit form config.
