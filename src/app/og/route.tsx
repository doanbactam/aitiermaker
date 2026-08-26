import { ImageResponse } from "next/og";
import { decodeState, seed } from "@/lib/state";
import { ITEMS } from "@/data/catalog";

export const contentType = "image/png";

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("s");
  const state = (raw && decodeState(raw)) || seed("models");
  const by = [state.by?.name, state.by?.handle].filter(Boolean).join(" · ");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#09090b",
          padding: "40px 44px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: "#c8f04b" }} />
          <div style={{ fontSize: 44, fontWeight: 800, color: "#f4f4f1", letterSpacing: -1, textTransform: "uppercase" }}>
            {(state.t || "AI Tier List").slice(0, 40)}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 16, color: "#8b8f98", marginTop: 8, letterSpacing: 2 }}>
          {(by ? `BY ${by.toUpperCase()} — ` : "") + "AITIERMAKER"}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 26, flex: 1 }}>
          {state.rows.map((r) => (
            <div key={r.l} style={{ display: "flex", alignItems: "stretch", gap: 12, flex: 1 }}>
              <div style={{ display: "flex", width: 110, borderRadius: 10, background: r.c, alignItems: "center", justifyContent: "center", fontSize: 34, fontWeight: 900, color: "rgba(0,0,0,.82)" }}>
                {r.l}
              </div>
              <div style={{ display: "flex", flex: 1, borderRadius: 10, background: "#101013", border: "1px solid #232329", alignItems: "center", padding: "0 20px", fontSize: 20, color: "#f2f2f0", fontWeight: 600 }}>
                {r.items.length === 0 ? <span style={{ color: "#3a3a42" }}>—</span> : r.items.map((id) => ITEMS[id]?.name ?? id).join("   ·   ")}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
