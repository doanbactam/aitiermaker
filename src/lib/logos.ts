export function logoProviders(domain: string): string[] {
  return [`https://unavatar.io/${domain}`, `https://www.google.com/s2/favicons?sz=128&domain=${domain}`];
}

export function fbColor(s: string): string {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `hsl(${h} 70% 82%)`;
}
