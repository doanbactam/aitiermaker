import { ImageResponse } from "next/og";
import { allItems, decodeState, seed } from "@/lib/state";

export const contentType = "image/png";

const MAX_PER_TIER = 4;

function tierSummary(state: ReturnType<typeof seed>, id: string): string {
  const [name] = allItems(state)[id] ?? [id];
  return name;
}

function formatTierItems(state: ReturnType<typeof seed>, ids: string[]): string {
  if (!ids.length) return "—";
  const shown = ids.slice(0, MAX_PER_TIER).map((id) => tierSummary(state, id));
  const rest = ids.length - shown.length;
  return rest > 0 ? `${shown.join("  ·  ")}  +${rest}` : shown.join("  ·  ");
}

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("s");
  const state = (raw && decodeState(raw)) || seed("models");
  const by = [state.by?.name, state.by?.handle].filter(Boolean).join(" · ");
  const ranked = state.rows.reduce((n, r) => n + r.items.length, 0);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(160deg, #0c0c0f 0%, #09090b 55%, #0a0a0d 100%)",
          padding: "36px 40px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: "#c8f04b", flexShrink: 0 }} />
            <div
              style={{
                fontSize: 38,
                fontWeight: 800,
                color: "#f4f4f1",
                letterSpacing: -0.5,
                textTransform: "uppercase",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {(state.t || "AI Tier List").slice(0, 44)}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              padding: "6px 12px",
              borderRadius: 999,
              border: "1px solid #2a2a32",
              background: "#111114",
              fontSize: 13,
              fontWeight: 700,
              color: "#c8f04b",
              flexShrink: 0,
            }}
          >
            {ranked} ranked
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 14, color: "#8b8f98", marginTop: 8, letterSpacing: 1.5, textTransform: "uppercase" }}>
          {(by ? `By ${by} — ` : "") + "aitiermaker"}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 22, flex: 1 }}>
          {state.rows.map((r) => (
            <div key={r.l} style={{ display: "flex", alignItems: "stretch", gap: 10, flex: 1, minHeight: 0 }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: 96,
                  borderRadius: 10,
                  background: r.c,
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  padding: "8px 6px",
                }}
              >
                <div style={{ fontSize: 30, fontWeight: 900, color: "rgba(0,0,0,.82)", lineHeight: 1 }}>{r.l}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(0,0,0,.55)", letterSpacing: 1, marginTop: 4, textTransform: "uppercase" }}>
                  {r.sub.slice(0, 10)}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flex: 1,
                  borderRadius: 10,
                  background: "#101013",
                  border: "1px solid #232329",
                  alignItems: "center",
                  padding: "0 16px",
                  fontSize: 17,
                  color: r.items.length ? "#f2f2f0" : "#3a3a42",
                  fontWeight: 600,
                  overflow: "hidden",
                }}
              >
                {formatTierItems(state, r.items)}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, fontSize: 13, color: "#5c6068", letterSpacing: 1, textTransform: "uppercase" }}>
          <span>Rank yours → aitiermaker</span>
          <span>Open link to remix</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
