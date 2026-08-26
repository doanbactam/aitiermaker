/**
 * Marks come from one of two places: an image the user uploaded (stored inline
 * as a data URL) or a domain we resolve through third-party favicon services.
 * `imageSources` is the only place that decides which.
 */

const DATA_IMAGE = /^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i;

/** True for an inline image produced by the add-item dialog. */
export function isUploadedImage(value: string): boolean {
  return DATA_IMAGE.test(value);
}

export function logoProviders(domain: string): string[] {
  return [`https://unavatar.io/${encodeURIComponent(domain)}`, `https://www.google.com/s2/favicons?sz=128&domain=${encodeURIComponent(domain)}`];
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
