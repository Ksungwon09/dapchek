import { ImageResponse } from "next/og"
import { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const score = searchParams.get("score") || "0"
    const round = searchParams.get("round") || "1"

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f8fafc",
            fontSize: 40,
            fontWeight: 700,
            color: "#334155"
          }}
        >
          <div style={{ marginBottom: 20, color: "#94a3b8" }}>답쳌 (Dapchek) 오답 수정 결과</div>
          <div
            style={{
              display: "flex",
              fontSize: 100,
              fontWeight: 900,
              color: "#2563eb",
              marginTop: 20,
              padding: "20px 40px",
              background: "#ffffff",
              borderRadius: "20px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            }}
          >
            {round}회차: {score}점
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e) {
    return new Response("Failed to generate image", { status: 500 })
  }
}
