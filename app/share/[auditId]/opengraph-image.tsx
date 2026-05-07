import { ImageResponse } from "next/og";

type ImageParams = {
  params: Promise<{ auditId: string }>;
};

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image({ params }: ImageParams) {
  const { auditId } = await params;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#f7f5ee",
        color: "#111111",
        border: "18px solid #111111",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ width: "58%", padding: 60, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontSize: 30, letterSpacing: 8, textTransform: "uppercase" }}>BillAudit public snapshot</div>
        <div style={{ marginTop: 28, fontSize: 96, fontWeight: 900, lineHeight: 0.88, letterSpacing: -6 }}>
          AI spend audit without exposing PII.
        </div>
        <div style={{ marginTop: 36, fontSize: 32 }}>Audit ID: {auditId}</div>
      </div>
      <div style={{ width: "42%", position: "relative", background: "#17e86f", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 92, left: 95, width: 280, height: 280, border: "8px solid #111111", borderRadius: "50%", background: "#ffffff" }} />
        <div style={{ position: "absolute", top: 195, left: 160, fontSize: 120, fontWeight: 900 }}>B</div>
        <div style={{ position: "absolute", right: 50, bottom: 60, width: 180, height: 180, background: "#ff8bd2", transform: "rotate(45deg)" }} />
      </div>
    </div>,
    size
  );
}
