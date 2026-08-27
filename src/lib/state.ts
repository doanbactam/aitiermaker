import { DEFAULT_ROWS, PRESETS, findPreset } from "@/data/presets";
import { ITEMS } from "@/data/catalog";
import { isUploadedImage } from "@/lib/logos";
import type { TierRow, TierState } from "@/lib/types";

export const LS_STATE = "aitier.state";

/** A compact wire payload is untrusted input, so bound what it can create. */
const MAX_ROWS = 24;
const MAX_PLACED = 400;
const MAX_TITLE = 120;
const MAX_LABEL = 24;
const MAX_NAME = 60;
const MAX_DOMAIN = 120;
const MAX_ID = 64;
/** Uploaded icons are ~4KB at 64px; the ceiling leaves room without inviting abuse. */
const MAX_IMAGE = 24_000;
const MAX_IMAGES = 40;

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

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

function asLabels(value: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!value || typeof value !== "object") return out;
  for (const [id, raw] of Object.entries(value as Record<string, unknown>)) {
    if (id.length > MAX_ID) continue;
    const name = text(raw, MAX_NAME).trim();
    if (name) out[id] = name;
  }
  return out;
}

export function seed(
  presetId: string,
  customs: Record<string, [string, string]> = {},
  by?: TierState["by"],
  labels: Record<string, string> = {},
): TierState {
  const preset = findPreset(presetId);
  const rows = DEFAULT_ROWS.map((r) => ({ ...r, items: [...(preset.seed[r.l] ?? [])] }));
  const placed = new Set(Object.values(preset.seed).flat());
  // Custom items belong to the board, not to the preset. Keeping them in the
  // pool is what the reset / switch-preset dialogs promise the user.
  const pool = Array.from(new Set([...preset.items, ...Object.keys(customs)])).filter((id) => !placed.has(id));
  return { p: preset.id, t: preset.title, rows, pool, customs, labels, by: by ?? { name: "", handle: "" } };
}

type CompactRow = { i: string[]; l?: string; c?: string };

function defaultRow(index: number): TierRow {
  return DEFAULT_ROWS[index % DEFAULT_ROWS.length];
}

function expandRows(raw: unknown): TierRow[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  if (Array.isArray(raw[0])) {
    return raw.slice(0, MAX_ROWS).map((items, i) => {
      const d = defaultRow(i);
      return { l: d.l, sub: "", c: d.c, items: idList(items) };
    });
  }
  const rows: TierRow[] = [];
  raw.slice(0, MAX_ROWS).forEach((entry, i) => {
    if (!entry || typeof entry !== "object") return;
    const row = entry as CompactRow & Partial<TierRow>;
    const items = Array.isArray(row.i) ? row.i : Array.isArray(row.items) ? row.items : null;
    if (!items) return;
    const d = defaultRow(i);
    rows.push({
      l: text(row.l, MAX_LABEL).trim() || d.l,
      sub: "",
      c: typeof row.c === "string" && HEX.test(row.c.trim()) ? row.c.trim() : d.c,
      items: idList(items),
    });
  });
  return rows.length ? rows : null;
}

function expandBy(raw: unknown): TierState["by"] {
  if (Array.isArray(raw) && raw.length >= 2) {
    return { name: text(raw[0], MAX_NAME), handle: text(raw[1], MAX_NAME) };
  }
  if (raw && typeof raw === "object") {
    const b = raw as TierState["by"];
    return { name: text(b.name, MAX_NAME), handle: text(b.handle, MAX_NAME) };
  }
  return { name: "", handle: "" };
}

function expandWire(value: Record<string, unknown>): TierState | null {
  const rows = expandRows(value.r ?? value.rows);
  if (!rows) return null;

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

  const title = text(value.t, MAX_TITLE).trim();
  const presetId = typeof value.p === "string" ? value.p : PRESETS[0].id;
  const preset = findPreset(presetId);

  return {
    p: presetId,
    t: title || preset.title || "Untitled",
    rows: rows.map((r) => ({ ...r, items: take(r.items) })),
    pool: take(idList(value.o ?? value.pool)),
    customs: asCustoms(value.c ?? value.customs),
    labels: asLabels(value.l ?? value.labels),
    by: expandBy(value.b ?? value.by),
  };
}

function asRow(value: unknown, index: number): TierRow | null {
  if (!value || typeof value !== "object") return null;
  const r = value as Partial<TierRow>;
  if (!Array.isArray(r.items)) return null;
  const fallback = DEFAULT_ROWS[index % DEFAULT_ROWS.length];
  const color = typeof r.c === "string" ? r.c.trim() : "";
  return {
    l: text(r.l, MAX_LABEL).trim() || fallback.l,
    sub: "",
    c: HEX.test(color) ? color : fallback.c,
    items: idList(r.items),
  };
}

function asCustoms(value: unknown): Record<string, [string, string]> {
  const out: Record<string, [string, string]> = {};
  if (!value || typeof value !== "object") return out;
  let images = 0;
  for (const [id, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!Array.isArray(raw) || id.length > MAX_ID) continue;
    const name = text(raw[0], MAX_NAME).trim();
    if (!name) continue;
    const second = typeof raw[1] === "string" ? raw[1].trim() : "";
    if (second.startsWith("data:")) {
      // Never truncate base64 — a clipped data URL is a broken image, so drop it.
      const ok = second.length <= MAX_IMAGE && images < MAX_IMAGES && isUploadedImage(second);
      if (ok) images += 1;
      out[id] = [name, ok ? second : ""];
      continue;
    }
    out[id] = [name, second.slice(0, MAX_DOMAIN)];
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
    labels: asLabels(s.labels),
    by: {
      name: text(s.by?.name, MAX_NAME),
      handle: text(s.by?.handle, MAX_NAME),
    },
  };
}

export function decodeState(raw: string): TierState | null {
  try {
    const parsed = JSON.parse(b64d(raw));
    if (!parsed || typeof parsed !== "object") return null;
    const compact = expandWire(parsed as Record<string, unknown>);
    if (compact) return compact;
    return asState(parsed);
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
  const out: Record<string, [string, string]> = { ...merged, ...s.customs };
  for (const [id, name] of Object.entries(s.labels ?? {})) {
    const base = out[id] ?? merged[id];
    if (base) out[id] = [name, base[1]];
  }
  return out;
}

