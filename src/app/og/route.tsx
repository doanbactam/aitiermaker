import { ImageResponse } from "next/og";
import { inkOnDark } from "@/lib/contrast";
import { pngFooterCta } from "@/lib/share";
import { allItems, seed } from "@/lib/state";
import { THEME_DARK, TIER_INK_CANVAS } from "@/lib/theme-colors";
import type { TierState } from "@/lib/types";

export const contentType = "image/png";

const MAX_PER_TIER = 4;
const T = THEME_DARK;

function formatTierItems(state: TierState, ids: string[]): string {
  if (!ids.length) return "—";
  const names = allItems(state);
  const shown = ids.slice(0, MAX_PER_TIER).map((id) => names[id]?.[0] ?? id);
  const rest = ids.length - shown.length;
  return rest > 0 ? `${shown.join("  ·  ")}  +${rest}` : shown.join("  ·  ");
}

export async function GET() {
  const state = seed("models");
  const by = [state.by.name, state.by.handle].filter(Boolean).join(" · ");
  const ranked = state.rows.reduce((n, r) => n + r.items.length, 0);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: `linear-gradient(160deg, ${T.bgGradTop} 0%, ${T.bgGradMid} 55%, ${T.bgGradBottom} 100%)`,
          padding: "36px 40px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: T.lime, flexShrink: 0 }} />
            <div
              style={{
                fontSize: 38,
                fontWeight: 800,
                color: T.fg,
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
              border: `1px solid ${T.line}`,
              background: T.panel,
              fontSize: 13,
              fontWeight: 700,
              color: T.lime,
              flexShrink: 0,
            }}
          >
            {ranked} ranked
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 14, color: T.mut, marginTop: 8, letterSpacing: 1.5, textTransform: "uppercase" }}>
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
                <div
                  style={{
                    fontSize: 30,
                    fontWeight: 900,
                    color: inkOnDark(r.c) ? TIER_INK_CANVAS.onDark : TIER_INK_CANVAS.onLight,
                    lineHeight: 1,
                  }}
                >
                  {r.l}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flex: 1,
                  borderRadius: 10,
                  background: T.panel2,
                  border: `1px solid ${T.line}`,
                  alignItems: "center",
                  padding: "0 16px",
                  fontSize: 17,
                  color: r.items.length ? T.fg : T.empty,
                  fontWeight: 600,
                  overflow: "hidden",
                }}
              >
                {formatTierItems(state, r.items)}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 14,
            padding: "14px 20px",
            borderRadius: 10,
            background: T.lime,
            fontSize: 15,
            fontWeight: 800,
            color: T.bg,
            letterSpacing: 0.6,
            textTransform: "uppercase",
          }}
        >
          {pngFooterCta("aitiermaker.com")}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
