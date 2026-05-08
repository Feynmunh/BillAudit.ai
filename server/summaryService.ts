import { GoogleGenAI } from "@google/genai";

import type { AuditResult, Lead } from "./models";

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  return apiKey ? new GoogleGenAI({ apiKey }) : null;
}

export async function generatePersonalizedSummary(result: AuditResult): Promise<string> {
  const fallback = result.summary ?? "Your AI stack audit is ready.";
  const client = getGeminiClient();
  if (!client) return fallback;

  const recommendationLines = [...result.tool_recommendations]
    .sort((left, right) => right.monthly_savings - left.monthly_savings)
    .slice(0, 3)
    .map((item) => `${item.tool_id}: save $${item.monthly_savings.toFixed(0)}/mo by using ${item.recommended_plan}`);
  const prompt = `Write a concise 90-110 word executive summary for an AI spend audit. Be finance-literate, specific, and avoid hype. Do not mention private data. Monthly spend: $${result.total_monthly_spend.toFixed(0)}. Monthly savings: $${result.total_monthly_savings.toFixed(0)}. Annual savings: $${result.total_annual_savings.toFixed(0)}. Savings level: ${result.savings_level}. Recommendations: ${recommendationLines.join("; ")}.`;

  try {
    const response = await client.models.generateContent({ model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash", contents: prompt });
    const generated = response.text?.trim();
    return generated || fallback;
  } catch (error) {
    return `${fallback} AI summary fallback used because the LLM request failed: ${error instanceof Error ? error.name : "UnknownError"}.`;
  }
}

export async function generateLeadBrief(result: AuditResult, lead: Lead): Promise<string> {
  const priority = result.savings_level === "high" ? "high-savings" : "standard";
  const fallback = `${priority} lead: ${lead.company ?? "Unknown company"} can save $${result.total_monthly_savings.toFixed(0)}/mo across ${result.tool_recommendations.length} audited tool(s).`;
  const client = getGeminiClient();
  if (!client) return fallback;

  const prompt = `Write a concise internal lead brief for Credex in 45 words max. Do not invent facts. Mention whether this is a high-savings case. Company: ${lead.company ?? "not provided"}. Role: ${lead.role ?? "not provided"}. Team size: ${lead.team_size ?? "not provided"}. Monthly savings: $${result.total_monthly_savings.toFixed(0)}. Annual savings: $${result.total_annual_savings.toFixed(0)}. Savings level: ${result.savings_level}.`;
  try {
    const response = await client.models.generateContent({ model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash", contents: prompt });
    return response.text?.trim() || fallback;
  } catch {
    return fallback;
  }
}
