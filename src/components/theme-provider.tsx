"use client";

import { useEffect, useSyncExternalStore } from "react";
import { applyTheme, readThemeMode, type ThemeMode } from "@/lib/theme";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", onChange);
  window.addEventListener("storage", onChange);
  window.addEventListener("aitier-theme", onChange);
  return () => {
    mq.removeEventListener("change", onChange);
    window.removeEventListener("storage", onChange);
    window.removeEventListener("aitier-theme", onChange);
  };
}

function getMode(): ThemeMode {
  return readThemeMode();
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useSyncExternalStore(subscribe, getMode, () => "system" as ThemeMode);

  useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  return children;
}
