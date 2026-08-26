export type ThemeMode = "light" | "dark" | "system";

export const LS_THEME = "aitier.theme";

export function resolveDark(mode: ThemeMode): boolean {
  if (typeof window === "undefined") return true;
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function readThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(LS_THEME);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
}

export function applyTheme(mode: ThemeMode) {
  const dark = resolveDark(mode);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.classList.toggle("light", !dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#09090b" : "#f6f6f4");
}

export function persistTheme(mode: ThemeMode) {
  localStorage.setItem(LS_THEME, mode);
  applyTheme(mode);
  window.dispatchEvent(new Event("aitier-theme"));
}

export const themeBootScript = `(function(){try{var m=localStorage.getItem("${LS_THEME}")||"system";var d=m==="dark"||(m==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.classList.toggle("light",!d);document.documentElement.style.colorScheme=d?"dark":"light";}catch(e){document.documentElement.classList.add("dark");}})();`;
