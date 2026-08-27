/** Dark-theme hex mirrors of CSS tokens — canvas and OG cannot read CSS variables. */
export const THEME_DARK = {
  bg: "#0a0a0b",
  bgGradTop: "#0c0c0f",
  bgGradMid: "#09090b",
  bgGradBottom: "#0a0a0d",
  panel: "#111114",
  panel2: "#17171c",
  line: "#26262e",
  line2: "#3d3d46",
  fg: "#f4f4f1",
  mut: "#9ba0aa",
  mut2: "#5c6068",
  lime: "#c8f04b",
  danger: "#ff6b6b",
  empty: "#3a3a42",
  logoBg: "#ffffff",
} as const;

export const TIER_INK = {
  onDark: {
    fg: "oklch(1 0 0 / 0.92)",
    border: "oklch(1 0 0 / 0.4)",
    ring: "oklch(1 0 0 / 0.45)",
  },
  onLight: {
    fg: "oklch(0.145 0.01 286 / 0.82)",
    border: "oklch(0.145 0.01 286 / 0.3)",
    ring: "oklch(0.145 0.01 286 / 0.28)",
  },
} as const;

export const TIER_BADGE = {
  onDark: { bg: "oklch(1 0 0 / 0.92)", fg: "oklch(0.145 0.01 286 / 0.78)" },
  onLight: { bg: "oklch(0.145 0.01 286 / 0.72)", fg: "oklch(1 0 0 / 0.94)" },
} as const;

/** Canvas-safe rgba mirrors of tier ink (no oklch in older canvas). */
export const TIER_INK_CANVAS = {
  onDark: "rgba(255,255,255,0.92)",
  onLight: "rgba(10,10,11,0.82)",
} as const;

export const DEFAULT_TIER_COLORS = ["#ef5350", "#f59f3d", "#e8c547", "#45c675", "#5eb0ef", "#a478f0"] as const;

export const TIER_PALETTE = [...DEFAULT_TIER_COLORS, "#f06292", "#4dd0a8"] as const;
