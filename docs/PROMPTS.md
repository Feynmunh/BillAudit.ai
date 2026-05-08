# Prompts

## Personalized summary prompt

The production prompt is built in `server/summaryService.ts` and sent to Gemini only when `GEMINI_API_KEY` or `GOOGLE_API_KEY` is configured. Gemini is the only LLM provider used by the backend.

```text
Write a concise 90-110 word executive summary for an AI spend audit. Be finance-literate, specific, and avoid hype. Do not mention private data. Monthly spend: $<total_monthly_spend>. Monthly savings: $<total_monthly_savings>. Annual savings: $<total_annual_savings>. Savings level: <savings_level>. Recommendations: <tool_id>: save $<monthly_savings>/mo by using <recommended_plan>; ...
```

Runtime settings:

- SDK: `@google/genai`
- Method: `client.models.generateContent(...)`
- Model: `GEMINI_MODEL` or `gemini-2.5-flash`
- Input recommendations: top 3 by monthly savings

## Why it is structured this way

- **90-110 words** keeps the result short enough for an executive dashboard.
- **Finance-literate, specific, avoid hype** keeps the tone aligned with operators and finance review.
- **Do not mention private data** reinforces the public-share privacy rule.
- **Monthly spend, monthly savings, annual savings, savings level** gives the LLM enough quantitative context without exposing raw lead details.
- **Top recommendations only** avoids long, low-signal summaries when multiple tools are audited.

## Fallback behavior

If `GEMINI_API_KEY` and `GOOGLE_API_KEY` are missing, the app returns the deterministic fallback summary from `server/auditEngine.ts`. If Gemini fails, the app returns the fallback plus this suffix:

```text
AI summary fallback used because the LLM request failed: <ErrorName>.
```

## Internal lead brief prompt

After lead capture, the backend asks Gemini for a 45-word internal Credex brief using only the optional company, role, team size, savings totals, and savings level. The output is stored in `leads.lead_summary`, is never shown on the public audit URL, and is separate from the Resend confirmation email sent to the user-entered address.

## Failed iterations

1. **Generic marketing summary**
   - Problem: sounded like ad copy and did not mention concrete savings.
   - Fix: added exact spend, savings, annual savings, and savings level.

2. **Verbose consultant memo**
   - Problem: too long for the dashboard and repeated recommendation details already shown in cards.
   - Fix: constrained output to 90-110 words and top 3 recommendations.

3. **Privacy-risk summary**
   - Problem: early phrasing could have encouraged mentioning company or user context.
   - Fix: explicitly added “Do not mention private data.”
