import { DEFAULT_ROWS, PRESETS } from "@/data/presets";
import { ITEMS } from "@/data/catalog";
import type { TierRow, TierState } from "@/lib/types";

export const LS_STATE = "aitier.state";

/** A shared `?s=` payload is untrusted input, so bound what it can create. */
const MAX_ROWS = 24;
const MAX_PLACED = 400;
const MAX_TITLE = 120;
const MAX_LABEL = 24;
const MAX_SUB = 40;
const MAX_NAME = 60;
const MAX_DOMAIN = 120;
const MAX_ID = 64;

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

export function b64e(s: string): string {
  return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function b64d(s: string): string {
  return decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))));
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function idList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is string => typeof x === "string" && x.length > 0 && x.length <= MAX_ID);
}

export function seed(presetId: string, customs: Record<string, [string, string]> = {}, by?: TierState["by"]): TierState {
  const preset = PRESETS.find((p) => p.id === presetId) ?? PRESETS[0];
  const rows = DEFAULT_ROWS.map((r) => ({ ...r, items: [...(preset.seed[r.l] ?? [])] }));
  const placed = new Set(Object.values(preset.seed).flat());
  // Custom items belong to the board, not to the preset. Keeping them in the
  // pool is what the reset / switch-preset dialogs promise the user.
  const pool = Array.from(new Set([...preset.items, ...Object.keys(customs)])).filter((id) => !placed.has(id));
  return { p: preset.id, t: preset.title, rows, pool, customs, by: by ?? { name: "", handle: "" } };
}

export function encodeState(s: TierState): string {
  return b64e(JSON.stringify(s));
}

function asRow(value: unknown, index: number): TierRow | null {
  if (!value || typeof value !== "object") return null;
  const r = value as Partial<TierRow>;
  if (!Array.isArray(r.items)) return null;
  const fallback = DEFAULT_ROWS[index % DEFAULT_ROWS.length];
  const color = typeof r.c === "string" ? r.c.trim() : "";
  return {
    l: text(r.l, MAX_LABEL).trim() || fallback.l,
    sub: text(r.sub, MAX_SUB),
    c: HEX.test(color) ? color : fallback.c,
    items: idList(r.items),
  };
}

function asCustoms(value: unknown): Record<string, [string, string]> {
  const out: Record<string, [string, string]> = {};
  if (!value || typeof value !== "object") return out;
  for (const [id, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!Array.isArray(raw) || id.length > MAX_ID) continue;
    const name = text(raw[0], MAX_NAME).trim();
    if (!name) continue;
    out[id] = [name, text(raw[1], MAX_DOMAIN).trim()];
  }
  return out;
}

function asState(value: unknown): TierState | null {
  if (!value || typeof value !== "object") return null;
  const s = value as Partial<TierState>;
  if (!Array.isArray(s.rows) || !Array.isArray(s.pool)) return null;

  const rows: TierRow[] = [];
  s.rows.slice(0, MAX_ROWS).forEach((raw, i) => {
    const row = asRow(raw, i);
    if (row) rows.push(row);
  });
  if (rows.length === 0) return null;

  // An id may only live in one container, and the board stays bounded.
  const seen = new Set<string>();
  let budget = MAX_PLACED;
  const take = (list: string[]): string[] => {
    const out: string[] = [];
    for (const id of list) {
      if (budget <= 0) break;
      if (seen.has(id)) continue;
      seen.add(id);
      budget -= 1;
      out.push(id);
    }
    return out;
  };

  const title = text(s.t, MAX_TITLE).trim();

  return {
    p: typeof s.p === "string" ? s.p : PRESETS[0].id,
    t: title || "Untitled",
    rows: rows.map((r) => ({ ...r, items: take(r.items) })),
    pool: take(idList(s.pool)),
    customs: asCustoms(s.customs),
    by: {
      name: text(s.by?.name, MAX_NAME),
      handle: text(s.by?.handle, MAX_NAME),
    },
    src: text(s.src, MAX_NAME).trim() || undefined,
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
  if (!ctx || !Number.isFinite(ctx) || ctx <= 0) return "—";
  if (ctx >= 1_000_000) {
    const m = ctx / 1_000_000;
    return `${Number.isInteger(m) ? m : m.toFixed(1)}M`;
  }
  return `${Math.round(ctx / 1000)}K`;
}
