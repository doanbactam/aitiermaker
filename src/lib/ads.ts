import { ADS, type Ad, type AdSlot } from "@/data/ads";

function daySeed(): number {
  const d = new Date();
  return d.getFullYear() * 1000 + d.getMonth() * 50 + d.getDate();
}

function slotSeed(slot: AdSlot): number {
  let h = daySeed();
  for (const ch of slot) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
}

function rotate<T>(items: T[], seed: number, count: number): T[] {
  if (!items.length || count <= 0) return [];
  const out: T[] = [];
  for (let i = 0; i < Math.min(count, items.length); i += 1) {
    out.push(items[(seed + i) % items.length]);
  }
  return out;
}

export function adsForSlot(slot: AdSlot, count = 1): Ad[] {
  const pool = ADS.filter((a) => a.slots.includes(slot));
  return rotate(pool, slotSeed(slot), count);
}

export function flankAds(count = 2): Ad[] {
  return adsForSlot("flank", count);
}

export function carouselAds(count = 4): Ad[] {
  return adsForSlot("carousel", count);
}

export function midBoardAd(): Ad | null {
  return adsForSlot("mid-board", 1)[0] ?? null;
}

export function feedAds(count = 3): Ad[] {
  return adsForSlot("feed", count);
}
