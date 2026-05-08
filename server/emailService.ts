import type { AuditResult, Lead } from "./models.js";

type EmailResult = "sent" | "skipped";

function money(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export async function sendAuditConfirmationEmail(lead: Lead, audit: AuditResult, publicUrl: string): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "BillAudit <onboarding@resend.dev>";
  if (!apiKey) return "skipped";

  const highSavingsLine = audit.savings_level === "high"
    ? "This is a high-savings case. Credex will reach out with renewal cleanup options."
    : "Credex will follow up if there is a clear renewal or credit optimization path.";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: lead.email,
      subject: `Your BillAudit found ${money(audit.total_monthly_savings)}/mo in AI savings`,
      html: `
        <div style="font-family:Arial,sans-serif;color:#111;line-height:1.5">
          <h1>Your AI spend audit is ready</h1>
          <p>BillAudit found <strong>${money(audit.total_monthly_savings)}/month</strong> and <strong>${money(audit.total_annual_savings)}/year</strong> in potential savings.</p>
          <p>${highSavingsLine}</p>
          <p><a href="${publicUrl}">Open your public, PII-safe audit snapshot</a></p>
          <p style="color:#666;font-size:12px">Company, email, and role are never shown on the public audit URL.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend email failed with status ${response.status}`);
  }
  return "sent";
}
