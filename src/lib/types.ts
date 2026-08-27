export type Category = "chat" | "coding" | "image" | "video" | "audio" | "local" | "infra";
export type License = "open" | "proprietary";

export interface CatalogItem {
  id: string;
  name: string;
  vendor: string;
  domain: string;
  cat: Category;
  license?: License;
  ctx?: number;
  price?: { in: number; out: number };
  elo?: number;
  updated: string;
  mark?: string;
}

export interface TierRow {
  l: string;
  sub: string;
  c: string;
  items: string[];
}

export interface TierState {
  p: string;
  t: string;
  rows: TierRow[];
  pool: string[];
  customs: Record<string, [string, string]>;
  /** User-edited display names for catalog items (id → name). */
  labels?: Record<string, string>;
  by: { name: string; handle: string };
}

export interface Preset {
  id: string;
  title: string;
  desc: string;
  items: string[];
  seed: Record<string, string[]>;
}
