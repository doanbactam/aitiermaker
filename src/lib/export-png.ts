import type { TierState } from "@/lib/types";
import { ITEMS } from "@/data/catalog";
import { MARKS } from "@/data/icons";
import { imageSources, fallbackSource, fbColor, isLogoDevUrl } from "@/lib/logos";
import { inkOnDark } from "@/lib/contrast";
import { pngFooterCta, publicShareHost } from "@/lib/share";
import { THEME_DARK, TIER_INK_CANVAS } from "@/lib/theme-colors";

const { bg: BG, panel2: CHIP, line: LINE, fg: FG, mut: MUT, lime: LIME, logoBg: LOGO_BG } = THEME_DARK;

function rr(x: CanvasRenderingContext2D, a: number, b: number, w: number, h: number, r: number) {
  x.beginPath();
  x.moveTo(a + r, b);
  x.arcTo(a + w, b, a + w, b + h, r);
  x.arcTo(a + w, b + h, a, b + h, r);
  x.arcTo(a, b + h, a, b, r);
  x.arcTo(a, b, a + w, b, r);
  x.closePath();
}

/**
 * Resolve a mark source to an image. Handles both uploaded data URLs (single
 * candidate, no network) and domains (favicon provider chain).
 */
function loadImage(value: string): Promise<HTMLImageElement | null> {
  return new Promise((res) => {
    const list = imageSources(value);
    if (!list.length) {
      res(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    const tryNext = (index: number) => {
      if (index >= list.length) {
        clearTimeout(timer);
        res(null);
        return;
      }
      img.referrerPolicy = isLogoDevUrl(list[index]) ? "origin" : "";
      img.src = list[index];
    };
    const timer = setTimeout(() => res(null), 4000);
    let i = 0;
    img.onload = () => {
      clearTimeout(timer);
      res(img);
    };
    img.onerror = () => {
      i += 1;
      tryNext(i);
    };
    tryNext(0);
  });
}

function toCanvas(state: TierState, names: Record<string, [string, string]>, marks: Record<string, string>): Promise<HTMLCanvasElement> {
  const W = 1200, PAD = 40, LW = 140, CH = 44, GAP = 8, FOOT = 56;
  const siteHost = publicShareHost();
  const ranked = state.rows.reduce((n, r) => n + r.items.length, 0);
  return new Promise(async (resolve) => {
    const cv = document.createElement("canvas");
    const x = cv.getContext("2d")!;
    const fontChip = "600 13px system-ui";
    const fontTitle = "800 46px system-ui";
    const fontMeta = "600 13px monospace";
    const fontBadge = "700 12px system-ui";
    x.font = fontChip;
    const tw = (s: string) => x.measureText(s).width;

    const chipW = new Map<string, number>();
    const all = state.rows.flatMap((r) => r.items);
    for (const id of all) chipW.set(id, 36 + tw((names[id]?.[0] ?? id).slice(0, 24)) + 16);

    const rowChunks = state.rows.map((r) => {
      const rows: string[][] = [];
      let cur: string[] = [];
      let w = 0;
      const max = W - PAD * 2 - LW - GAP;
      for (const id of r.items) {
        const cw = chipW.get(id)!;
        if (cur.length && w + GAP + cw > max) {
          rows.push(cur);
          cur = [];
          w = 0;
        }
        cur.push(id);
        w += (cur.length > 1 ? GAP : 0) + cw;
      }
      if (cur.length) rows.push(cur);
      return rows;
    });

    const headH = 128;
    const bodyH = state.rows.reduce((a, _, i) => a + Math.max(1, rowChunks[i].length) * (CH + GAP) + GAP + 10, 0);
    const H = headH + bodyH + FOOT;
    cv.width = W;
    cv.height = H;

    x.fillStyle = BG;
    x.fillRect(0, 0, W, H);

    if (ranked > 0) {
      x.font = fontBadge;
      const badge = `${ranked} ranked`;
      const badgeW = tw(badge) + 24;
      const badgeX = W - PAD - badgeW;
      x.fillStyle = CHIP;
      rr(x, badgeX, 34, badgeW, 30, 15);
      x.fill();
      x.strokeStyle = LIME;
      x.lineWidth = 1.5;
      rr(x, badgeX + 0.75, 34.75, badgeW - 1.5, 28.5, 15);
      x.stroke();
      x.fillStyle = LIME;
      x.textAlign = "center";
      x.textBaseline = "middle";
      x.fillText(badge, badgeX + badgeW / 2, 49);
      x.textBaseline = "alphabetic";
      x.textAlign = "left";
    }

    x.fillStyle = LIME;
    x.fillRect(PAD, 44, 12, 12);
    x.fillStyle = FG;
    x.font = fontTitle;
    x.textBaseline = "alphabetic";
    const title = (state.t || "AI Tier List").toUpperCase();
    const titleMax = ranked > 0 ? W - PAD * 2 - 140 : W - PAD * 2;
    let titleDraw = title;
    while (titleDraw.length > 1 && tw(titleDraw) > titleMax) titleDraw = titleDraw.slice(0, -1);
    if (titleDraw.length < title.length) titleDraw = titleDraw.slice(0, -1) + "…";
    x.fillText(titleDraw, PAD + 22, 58);

    x.fillStyle = MUT;
    x.font = fontMeta;
    const by = [state.by.name, state.by.handle].filter(Boolean).join(" · ");
    x.fillText((by ? `BY ${by.toUpperCase()} — ` : "") + "AITIERMAKER", PAD + 22, 82);

    const favicons: Record<string, HTMLImageElement | null> = {};
    const needFavicon = all.filter((id) => !marks[id] && names[id]);
    await Promise.all(needFavicon.map(async (id) => { favicons[id] = await loadImage(names[id][1]); }));

    let y = headH;
    x.textAlign = "center";
    state.rows.forEach((r, ri) => {
      const rh = Math.max(1, rowChunks[ri].length) * (CH + GAP) + 8;
      x.fillStyle = r.c;
      rr(x, PAD, y, LW, rh, 10);
      x.fill();
      x.fillStyle = inkOnDark(r.c) ? TIER_INK_CANVAS.onDark : TIER_INK_CANVAS.onLight;
      x.font = "900 34px system-ui";
      x.fillText(r.l, PAD + LW / 2, y + rh / 2 + 2);

      let cy = y;
      for (const chunk of rowChunks[ri]) {
        let cx = PAD + LW + GAP;
        for (const id of chunk) {
          const cw = chipW.get(id)!;
          x.fillStyle = CHIP;
          rr(x, cx, cy, cw, CH, 8);
          x.fill();
          x.strokeStyle = LINE;
          x.lineWidth = 1;
          rr(x, cx + 0.5, cy + 0.5, cw - 1, CH - 1, 8);
          x.stroke();
          const mkKey = marks[id];
          const mx = cx + 6, my = cy + (CH - 22) / 2;
          if (mkKey && MARKS[mkKey]) {
            const m = MARKS[mkKey];
            x.fillStyle = m.bg;
            rr(x, mx, my, 22, 22, 5);
            x.fill();
            x.save();
            x.translate(mx + 3.5, my + 3.5);
            x.scale(15 / 24, 15 / 24);
            x.fillStyle = m.fg;
            x.fill(new Path2D(m.path));
            x.restore();
          } else if (favicons[id]) {
            x.fillStyle = LOGO_BG;
            rr(x, mx, my, 22, 22, 5);
            x.fill();
            const im = favicons[id]!;
            const ar = im.width / im.height;
            let dw = 15, dh = 15;
            if (ar > 1) dh = 15 / ar;
            else dw = 15 * ar;
            x.drawImage(im, mx + (22 - dw) / 2, my + (22 - dh) / 2, dw, dh);
          } else {
            const fbSrc = fallbackSource(names[id]?.[0] ?? id, names[id]?.[1] ?? "");
            x.fillStyle = fbColor(fbSrc);
            x.beginPath();
            x.arc(mx + 11, my + 11, 11, 0, 7);
            x.fill();
            x.fillStyle = CHIP;
            x.font = "800 12px system-ui";
            x.fillText(fbSrc[0].toUpperCase(), mx + 11, my + 15.5);
          }
          x.fillStyle = FG;
          x.font = fontChip;
          x.textAlign = "left";
          x.fillText((names[id]?.[0] ?? id).slice(0, 24), cx + 36, cy + CH / 2 + 4.5);
          cx += cw + GAP;
        }
        cy += CH + GAP;
      }
      y += rh + GAP + 2;
    });

    x.fillStyle = LIME;
    x.fillRect(0, H - FOOT, W, FOOT);
    x.fillStyle = BG;
    x.font = "800 15px system-ui";
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText(pngFooterCta(siteHost).toUpperCase(), W / 2, H - FOOT / 2);
    x.textBaseline = "alphabetic";
    x.textAlign = "left";
    resolve(cv);
  });
}

function itemMarks(state: TierState): Record<string, string> {
  const out: Record<string, string> = {};
  for (const id of state.rows.flatMap((r) => r.items)) {
    if (!state.customs[id]) out[id] = ITEMS[id]?.mark ?? "";
  }
  return out;
}

function pngFilename(state: TierState): string {
  return (state.t || "ai-tier-list").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".png";
}

async function pngBlob(state: TierState, names: Record<string, [string, string]>): Promise<Blob | null> {
  const cv = await toCanvas(state, names, itemMarks(state));
  return new Promise((res) => cv.toBlob(res));
}

function downloadBlob(blob: Blob, filename: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

async function writePngClipboard(blob: Blob): Promise<boolean> {
  try {
    if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) return false;
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    return true;
  } catch {
    return false;
  }
}

export type PngShareResult = "shared" | "downloaded" | "failed";

/**
 * Hand PNG to the user for an X post.
 * Mobile: Web Share with the image file when the OS supports it.
 * Desktop: always download — X's web intent cannot attach media, and clipboard
 * paste into the compose box is unreliable across browsers.
 */
export async function sharePNGForX(
  state: TierState,
  names: Record<string, [string, string]>,
  caption: string,
): Promise<PngShareResult> {
  const blob = await pngBlob(state, names);
  if (!blob) return "failed";

  const file = new File([blob], pngFilename(state), { type: "image/png" });
  if (typeof navigator.share === "function" && typeof navigator.canShare === "function") {
    try {
      const payload = { files: [file], text: caption };
      if (navigator.canShare(payload)) {
        await navigator.share(payload);
        return "shared";
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return "failed";
    }
  }

  downloadBlob(blob, pngFilename(state));
  return "downloaded";
}

export async function renderPngObjectUrl(
  state: TierState,
  names: Record<string, [string, string]>,
): Promise<string | null> {
  const blob = await pngBlob(state, names);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

export async function exportPNG(state: TierState, names: Record<string, [string, string]>) {
  const blob = await pngBlob(state, names);
  if (!blob) return;
  downloadBlob(blob, pngFilename(state));
}

export async function copyPNG(state: TierState, names: Record<string, [string, string]>): Promise<boolean> {
  const blob = await pngBlob(state, names);
  if (!blob) return false;
  return writePngClipboard(blob);
}
