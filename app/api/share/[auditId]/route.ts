import { AuditStore } from "@/server/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const auditStore = new AuditStore();

type RouteParams = {
  params: Promise<{ auditId: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { auditId } = await params;
    const publicAudit = await auditStore.getPublicAudit(auditId);
    if (!publicAudit) {
      return Response.json({ detail: "Audit not found" }, { status: 404 });
    }
    return Response.json(publicAudit);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal error";
    return Response.json({ success: false, error: `Internal error: ${message}` }, { status: 500 });
  }
}
