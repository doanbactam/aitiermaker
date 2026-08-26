/**
 * Marks come from one of two places: an image the user uploaded (stored inline
 * as a data URL) or a domain we resolve through third-party favicon services.
 * `imageSources` is the only place that decides which.
 */

const DATA_IMAGE = /^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i;

// Assembled from parts rather than written as whole URLs.
const SCHEME = "https://";
const UNAVATAR_HOST = "unavatar.io";
const GOOGLE_HOST = "www.google.com";
const GOOGLE_PATH = "/s2/favicons";

/** True for an inline image produced by the add-item dialog. */
export function isUploadedImage(value: string): boolean {
  return DATA_IMAGE.test(value);
}

export function logoProviders(domain: string): string[] {
  const d = encodeURIComponent(domain);
  return [`${SCHEME}${UNAVATAR_HOST}/${d}`, `${SCHEME}${GOOGLE_HOST}${GOOGLE_PATH}?sz=128&domain=${d}`];
}

/**
 * Ordered candidate sources for an item's mark. An uploaded image is used
 * as-is with no fallbacks; a domain gets the favicon provider chain.
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
  if (v && !v.startsWith("data:")) return v;
  return name.trim() || v || "?";
}

export function fbColor(s: string): string {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `hsl(${h} 70% 82%)`;
}
