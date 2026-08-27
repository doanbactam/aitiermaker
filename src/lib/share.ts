import type { TierState } from "@/lib/types";

const DEFAULT_HOST = "aitiermaker.com";

function isLocalHost(host: string): boolean {
  const h = host.toLowerCase();
  return h === "localhost" || h.startsWith("localhost:") || h === "127.0.0.1" || h.startsWith("127.0.0.1:") || h === "[::1]" || h.startsWith("[::1]:");
}

function hostFromUrl(raw: string): string | null {
  try {
    return new URL(raw).host;
  } catch {
    return null;
  }
}

/** Host for viral CTAs — never localhost, so posts always point at the public site. */
export function publicShareHost(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) {
    const host = hostFromUrl(env);
    if (host && !isLocalHost(host)) return host;
  }
  if (typeof window !== "undefined") {
    const host = window.location.host;
    if (!isLocalHost(host)) return host;
  }
  return DEFAULT_HOST;
}

export function publicShareOrigin(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) {
    try {
      const url = new URL(env);
      if (!isLocalHost(url.host)) return url.origin;
    } catch {
      /* fall through */
    }
  }
  if (typeof window !== "undefined" && !isLocalHost(window.location.host)) {
    return window.location.origin;
  }
  return `https://${DEFAULT_HOST}`;
}

/** Short CTA baked into exported PNG footers. */
export function pngFooterCta(host = publicShareHost()): string {
  return `Disagree? Make yours → ${host}`;
}

/**
 * X post copy. Image carries the list; text is a short hook.
 * Site URL is passed separately via the intent `url` param — do not embed it here
 * or X will show it twice.
 */
export function postCaption(s: TierState): string {
  const author = (s.by.handle || s.by.name).trim();
  const title = s.t.trim() || "My tier list";
  const lead = author ? `${title} — ${author}` : title;
  return `${lead}\nAgree or disagree? Rank yours ↓\n#AITierList #TierList`;
}
