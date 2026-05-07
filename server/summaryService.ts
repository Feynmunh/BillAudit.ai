import Anthropic from "@anthropic-ai/sdk";

import type { AuditResult } from "./models.js";

export async function generatePersonalizedSummary(result: AuditResult): Promise<string> {
  const fallback = result.summary ?? "Your AI stack audit is ready.";
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return fallback;

  const recommendationLines = [...result.tool_recommendations]
    .sort((left, right) => right.monthly_savings - left.monthly_savings)
    .slice(0, 3)
    .map((item) => `${item.tool_id}: save $${item.monthly_savings.toFixed(0)}/mo by using ${item.recommended_plan}`);
  const prompt = `Write a concise 90-110 word executive summary for an AI spend audit. Be finance-literate, specific, and avoid hype. Do not mention private data. Monthly spend: $${result.total_monthly_spend.toFixed(0)}. Monthly savings: $${result.total_monthly_savings.toFixed(0)}. Annual savings: $${result.total_annual_savings.toFixed(0)}. Savings level: ${result.savings_level}. Recommendations: ${recommendationLines.join("; ")}.`;

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({ model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-latest", max_tokens: 180, messages: [{ role: "user", content: prompt }] });
    const generated = response.content.filter((block) => block.type === "text").map((block) => block.text).join(" ").trim();
    return generated || fallback;
  } catch (error) {
    return `${fallback} AI summary fallback used because the LLM request failed: ${error instanceof Error ? error.name : "UnknownError"}.`;
  }
}
