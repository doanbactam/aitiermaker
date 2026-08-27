/**
 * Marks come from one of two places: an image the user uploaded (stored inline
 * as a data URL) or a domain we resolve through Logo.dev and public favicon
 * services. `imageSources` is the only place that decides which.
 */

const DATA_IMAGE = /^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i;

const SCHEME = "https://";
const LOGO_DEV_HOST = "img.logo.dev";
const UNAVATAR_HOST = "unavatar.io";
const GOOGLE_HOST = "www.google.com";
const GOOGLE_PATH = "/s2/favicons";

export const LS_LOGO_DEV = "aitier.logodev";

/** True for an inline image produced by the add-item dialog. */
export function isUploadedImage(value: string): boolean {
  return DATA_IMAGE.test(value);
}

export function isLogoDevUrl(url: string): boolean {
  return url.includes(`${LOGO_DEV_HOST}/`);
}

/** Publishable key: localStorage override, then `NEXT_PUBLIC_LOGO_DEV_KEY`. */
export function getLogoDevKey(): string {
  const env = process.env.NEXT_PUBLIC_LOGO_DEV_KEY?.trim() ?? "";
  if (typeof window === "undefined") return env;
  try {
    const stored = localStorage.getItem(LS_LOGO_DEV)?.trim();
    return stored || env;
  } catch {
    return env;
  }
}

export function persistLogoDevKey(key: string): void {
  if (typeof window === "undefined") return;
  const trimmed = key.trim();
  if (trimmed) localStorage.setItem(LS_LOGO_DEV, trimmed);
  else localStorage.removeItem(LS_LOGO_DEV);
  window.dispatchEvent(new Event("aitier-logodev"));
}

/** Strip scheme, path, and www. Keeps data URLs untouched. */
export function normalizeDomain(raw: string): string {
  const v = raw.trim();
  if (!v || v.startsWith("data:")) return v;
  return v
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split(/[/?#]/)[0]
    .slice(0, 120);
}

function logoDevUrl(domain: string, key: string): string {
  return `${SCHEME}${LOGO_DEV_HOST}/${encodeURIComponent(domain)}?token=${encodeURIComponent(key)}&size=128&format=png`;
}

export function logoProviders(domain: string): string[] {
  const d = normalizeDomain(domain);
  if (!d || d.startsWith("data:")) return [];
  const out: string[] = [];
  const key = getLogoDevKey();
  if (key) out.push(logoDevUrl(d, key));
  out.push(`${SCHEME}${UNAVATAR_HOST}/${encodeURIComponent(d)}`, `${SCHEME}${GOOGLE_HOST}${GOOGLE_PATH}?sz=128&domain=${encodeURIComponent(d)}`);
  return out;
}

/**
 * Ordered candidate sources for an item's mark. An uploaded image is used
 * as-is with no fallbacks; a domain gets the logo provider chain.
 * Returns an empty list when there is nothing to render, so callers draw a
 * letter instead.
 */
export function imageSources(value: string): string[] {
  const v = value.trim();
  if (!v) return [];
  if (isUploadedImage(v)) return [v];
  if (v.startsWith("data:")) return [];
  return logoProviders(v);
}

/** Character and colour for the letter mark, never a data URL fragment. */
export function fallbackSource(name: string, value: string): string {
  const v = value.trim();
  if (v && !v.startsWith("data:")) return normalizeDomain(v) || v;
  return name.trim() || v || "?";
}

export function fbColor(s: string): string {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `hsl(${h} 70% 82%)`;
}
