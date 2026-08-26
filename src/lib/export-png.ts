import type { TierState } from "@/lib/types";
import { ITEMS } from "@/data/catalog";
import { MARKS } from "@/data/icons";
import { imageSources, fallbackSource, fbColor } from "@/lib/logos";

const BG = "#0a0a0b", CHIP = "#17171c", LINE = "#232329", FG = "#f2f2f0", MUT = "#8b8f98";

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
    let i = 0;
    const img = new Image();
    img.crossOrigin = "anonymous";
    const timer = setTimeout(() => res(null), 4000);
    img.onload = () => {
      clearTimeout(timer);
      res(img);
    };
    img.onerror = () => {
      if (++i < list.length) img.src = list[i];
      else {
        clearTimeout(timer);
        res(null);
      }
    };
    img.src = list[0];
  });
}

function toCanvas(state: TierState, names: Record<string, [string, string]>, marks: Record<string, string>): Promise<HTMLCanvasElement> {
  const W = 1200, PAD = 40, LW = 140, CH = 44, GAP = 8;
  return new Promise(async (resolve) => {
    const cv = document.createElement("canvas");
    const x = cv.getContext("2d")!;
    const fontChip = "600 13px system-ui";
    const fontTitle = "800 46px system-ui";
    const fontBy = "600 13px monospace";
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
    const H = headH + bodyH + 56;
    cv.width = W;
    cv.height = H;

    x.fillStyle = BG;
    x.fillRect(0, 0, W, H);

    x.fillStyle = "#c8f04b";
    x.fillRect(PAD, 44, 12, 12);
    x.fillStyle = FG;
    x.font = fontTitle;
    x.textBaseline = "alphabetic";
    x.fillText((state.t || "AI Tier List").toUpperCase().slice(0, 38), PAD + 22, 58);
    x.fillStyle = MUT;
    x.font = fontBy;
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
      x.fillStyle = "rgba(0,0,0,.82)";
      x.font = "900 34px system-ui";
      x.fillText(r.l, PAD + LW / 2, y + rh / 2 + 2);
      x.font = "700 9px monospace";
      x.fillStyle = "rgba(0,0,0,.6)";
      x.fillText(r.sub.toUpperCase(), PAD + LW / 2, y + rh / 2 + 20);

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
            x.fillStyle = "#ffffff";
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
            x.fillStyle = "#101013";
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

    x.fillStyle = MUT;
    x.font = "600 12px monospace";
    x.textAlign = "left";
    x.fillText(`RANK YOURS → ${location.host}`, PAD, H - 24);
    x.textAlign = "right";
    x.fillText("AITIERMAKER", W - PAD, H - 24);
    x.textAlign = "left";
    resolve(cv);
  });
}

export async function exportPNG(state: TierState, names: Record<string, [string, string]>) {
  const cv = await toCanvas(state, names, itemMarks(state));
  cv.toBlob((b) => {
    if (!b) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = (state.t || "ai-tier-list").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + ".png";
    a.click();
    URL.revokeObjectURL(a.href);
  });
}

function itemMarks(state: TierState): Record<string, string> {
  const out: Record<string, string> = {};
  for (const id of state.rows.flatMap((r) => r.items)) {
    if (!state.customs[id]) out[id] = ITEMS[id]?.mark ?? "";
  }
  return out;
}

export async function copyPNG(state: TierState, names: Record<string, [string, string]>): Promise<boolean> {
  try {
    if (typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) return false;
    const cv = await toCanvas(state, names, itemMarks(state));
    const blob = await new Promise<Blob | null>((res) => cv.toBlob(res));
    if (!blob) return false;
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    return true;
  } catch {
    return false;
  }
}
