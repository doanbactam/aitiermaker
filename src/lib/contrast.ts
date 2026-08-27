/**
 * WCAG relative luminance + the project-wide threshold for "dark". Tier colours
 * come from a free colour picker, so anything drawn on one computes its own ink
 * instead of assuming black or white text works.
 */
export function relativeLuminance(hex: string): number {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  if (full.length !== 6) return 1;
  const channel = (i: number) => {
    const v = parseInt(full.slice(i, i + 2), 16) / 255;
    return Number.isNaN(v) ? 1 : v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
}

export function inkOnDark(hex: string): boolean {
  return relativeLuminance(hex) < 0.36;
}

export function tierInk(dark: boolean) {
  return dark
    ? { color: "oklch(1 0 0 / 0.92)", borderColor: "oklch(1 0 0 / 0.4)" }
    : { color: "oklch(0.145 0.01 286 / 0.82)", borderColor: "oklch(0.145 0.01 286 / 0.3)" };
}

export function tierBadgeInk(dark: boolean) {
  return dark
    ? { background: "oklch(1 0 0 / 0.92)", color: "oklch(0.145 0.01 286 / 0.78)" }
    : { background: "oklch(0.145 0.01 286 / 0.72)", color: "oklch(1 0 0 / 0.94)" };
}

export function tierRingClass(dark: boolean): string {
  return dark
    ? "focus:shadow-[0_0_0_2px_oklch(1_0_0/0.45)]"
    : "focus:shadow-[0_0_0_2px_oklch(0.145_0.01_286/0.28)]";
}
