"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import { getLogoDevKey } from "@/lib/logos";
import { layoutShell, siteFooter } from "@/lib/ui-styles";

type BoardFooterProps = {
  onLogoKey?: () => void;
};

function subscribeLogoKey(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("aitier-logodev", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("aitier-logodev", onChange);
  };
}

const YEAR = new Date().getUTCFullYear();

export function BoardFooter({ onLogoKey }: BoardFooterProps) {
  const hasKey = useSyncExternalStore(subscribeLogoKey, () => Boolean(getLogoDevKey()), () => false);

  return (
    <footer className={siteFooter}>
      <div className={cn(layoutShell, "flex flex-col gap-y-inset py-control text-[11px] text-mut2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-group")}>
        <p className="min-w-0 font-mono leading-relaxed">
          <span className="text-mut">© {YEAR}</span>{" "}
          <Link href="/" className="font-semibold text-fg/80 no-underline transition-colors hover:text-fg">
            AI Tier Maker
          </Link>
        </p>
        <div className="flex flex-wrap items-center gap-x-group gap-y-inset font-mono text-[10px] font-semibold uppercase tracking-[0.06em]">
          <a href="https://logo.dev" target="_blank" rel="noopener noreferrer" className="text-mut2 transition-colors hover:text-fg">
            Logos by Logo.dev
          </a>
          {onLogoKey && (
            <button type="button" className="text-mut2 transition-colors hover:text-fg" onClick={onLogoKey}>
              Logo key{hasKey ? " ✓" : ""}
            </button>
          )}
        </div>
      </div>
    </footer>
  );
}
