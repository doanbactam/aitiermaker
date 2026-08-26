"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { persistTheme, readThemeMode, type ThemeMode } from "@/lib/theme";
import { useSyncExternalStore } from "react";

const ORDER: ThemeMode[] = ["light", "dark", "system"];

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("aitier-theme", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("aitier-theme", onChange);
  };
}

function label(mode: ThemeMode) {
  if (mode === "light") return "Light theme";
  if (mode === "dark") return "Dark theme";
  return "System theme";
}

export function ThemeToggle() {
  const mode = useSyncExternalStore(subscribe, readThemeMode, () => "system" as ThemeMode);

  const cycle = () => {
    const next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
    persistTheme(next);
  };

  return (
    <button type="button" className={buttonClass("icon")} onClick={cycle} aria-label={label(mode)} title={label(mode)}>
      {mode === "light" && <Sun size={14} strokeWidth={2} aria-hidden="true" />}
      {mode === "dark" && <Moon size={14} strokeWidth={2} aria-hidden="true" />}
      {mode === "system" && <Monitor size={14} strokeWidth={2} aria-hidden="true" />}
    </button>
  );
}
