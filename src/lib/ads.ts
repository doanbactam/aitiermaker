import { ADS, type Ad, type AdSlot } from "@/data/ads";

/** Filled in this order. An earlier slot wins an ad both slots could use. */
const SLOT_ORDER: AdSlot[] = ["mid-board", "list"];

const SLOT_LIMIT: Record<AdSlot, number> = { "mid-board": 1, list: 3 };

/**
 * Rotates daily. Read in UTC on purpose: a server in UTC and a browser in
 * UTC+7 otherwise disagree about the date for seven hours a day, which rotates
 * a different ad into the same slot and trips a hydration mismatch.
 */
function daySeed(now = new Date()): number {
  return now.getUTCFullYear() * 372 + now.getUTCMonth() * 31 + now.getUTCDate();
}

/**
 * Assigns every slot in one pass so a sponsor is never shown twice on the same
 * page. Filling slots independently is what let one ad occupy the flank, the
 * carousel and the mid-board block simultaneously.
 */
function allocate(seed: number): Record<AdSlot, Ad[]> {
  const out: Record<AdSlot, Ad[]> = { "mid-board": [], list: [] };
  const taken = new Set<string>();
  for (const slot of SLOT_ORDER) {
    const pool = ADS.filter((ad) => ad.slots.includes(slot) && !taken.has(ad.id));
    const take = Math.min(SLOT_LIMIT[slot], pool.length);
    for (let i = 0; i < take; i += 1) {
      const ad = pool[(seed + i) % pool.length];
      if (taken.has(ad.id)) continue;
      taken.add(ad.id);
      out[slot].push(ad);
    }
  }
  return out;
}

let cache: { seed: number; slots: Record<AdSlot, Ad[]> } | null = null;

/** Memoised per day so every slot in one render sees the same allocation. */
function slots(): Record<AdSlot, Ad[]> {
  const seed = daySeed();
  if (!cache || cache.seed !== seed) cache = { seed, slots: allocate(seed) };
  return cache.slots;
}

export function midBoardAd(): Ad | null {
  return slots()["mid-board"][0] ?? null;
}

export function sponsorAds(): Ad[] {
  return slots().list;
}
