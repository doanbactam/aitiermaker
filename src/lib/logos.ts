const LS_KEY = "aitier.logodev";

export function logoProviders(domain: string): string[] {
  let key: string | null = null;
  try {
    key = localStorage.getItem(LS_KEY);
  } catch {}
  const list: string[] = [];
  if (key) list.push(`https://img.logo.dev/${domain}?token=${encodeURIComponent(key)}&size=144&format=png`);
  list.push(`https://unavatar.io/${domain}`, `https://www.google.com/s2/favicons?sz=128&domain=${domain}`);
  return list;
}

export function fbColor(s: string): string {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `hsl(${h} 70% 82%)`;
}
