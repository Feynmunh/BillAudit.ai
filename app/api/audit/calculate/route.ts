import { AuditEngine } from "@/server/auditEngine";
import { auditRequestSchema } from "@/server/models";
import { AuditStore } from "@/server/storage";
import { generatePersonalizedSummary } from "@/server/summaryService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const auditEngine = new AuditEngine();
const auditStore = new AuditStore();

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Internal error";
  const status = message.startsWith("Unknown tool_id") ? 400 : 500;
  return Response.json({ success: false, error: status === 500 ? `Internal error: ${message}` : message }, { status });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = auditRequestSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ success: false, error: parsed.error.issues.map((issue) => issue.message).join("; ") }, { status: 400 });
    }

    const result = auditEngine.runAudit(parsed.data);
    result.ai_summary = await generatePersonalizedSummary(result);
    await auditStore.saveAudit(result);

    return Response.json({ success: true, data: result });
  } catch (error) {
    return errorResponse(error);
  }
}
