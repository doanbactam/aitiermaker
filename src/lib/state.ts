import { DEFAULT_ROWS, PRESETS } from "@/data/presets";
import { ITEMS } from "@/data/catalog";
import type { TierState } from "@/lib/types";

export const LS_STATE = "aitier.state";

export function b64e(s: string): string {
  return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function b64d(s: string): string {
  return decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))));
}

export function seed(presetId: string, customs: Record<string, [string, string]> = {}, by?: TierState["by"]): TierState {
  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0];
  const rows = DEFAULT_ROWS.map((r) => ({ ...r, items: [...(preset.seed[r.l] ?? [])] }));
  const placed = new Set(Object.values(preset.seed).flat());
  return { p: preset.id, t: preset.title, rows, pool: preset.items.filter((id) => !placed.has(id)), customs, by: by ?? { name: "", handle: "" } };
}

export function encodeState(s: TierState): string {
  return b64e(JSON.stringify(s));
}

function asState(value: unknown): TierState | null {
  if (!value || typeof value !== "object") return null;
  const s = value as TierState;
  if (!Array.isArray(s.rows) || !Array.isArray(s.pool)) return null;
  return {
    p: typeof s.p === "string" ? s.p : PRESETS[0].id,
    t: typeof s.t === "string" && s.t.trim() ? s.t : "Untitled",
    rows: s.rows,
    pool: s.pool,
    customs: s.customs && typeof s.customs === "object" ? s.customs : {},
    by: {
      name: s.by?.name ?? "",
      handle: s.by?.handle ?? "",
    },
    src: typeof s.src === "string" && s.src ? s.src : undefined,
  };
}

export function decodeState(raw: string): TierState | null {
  try {
    return asState(JSON.parse(b64d(raw)));
  } catch {
    return null;
  }
}

export function parseStored(raw: string): TierState | null {
  try {
    const parsed = asState(JSON.parse(raw));
    if (parsed) return parsed;
  } catch {}
  return decodeState(raw);
}

export function loadState(): TierState {
  if (typeof window === "undefined") return seed(PRESETS[0].id);
  const sp = new URLSearchParams(window.location.search);
  const fromUrl = sp.get("s");
  if (fromUrl) {
    const s = decodeState(fromUrl);
    if (s) return s;
  }
  try {
    const raw = localStorage.getItem(LS_STATE);
    if (raw) {
      const s = parseStored(raw);
      if (s) return s;
    }
  } catch {}
  return seed(PRESETS[0].id);
}

export function allItems(s: TierState): Record<string, [string, string]> {
  const merged: Record<string, [string, string]> = {};
  for (const [id, item] of Object.entries(ITEMS)) merged[id] = [item.name, item.domain];
  return { ...merged, ...s.customs };
}

export function fmtCtx(ctx?: number): string {
  if (!ctx) return "—";
  if (ctx >= 1_000_000) return `${ctx / 1_000_000}M`;
  return `${Math.round(ctx / 1000)}K`;
}
