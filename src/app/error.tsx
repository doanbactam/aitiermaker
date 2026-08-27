"use client";

import { BoardFooter } from "@/components/board-footer";
import { BrandLogo } from "@/components/brand-logo";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { layoutShell } from "@/lib/ui-styles";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <SiteShell
      header={
        <div className={cn(layoutShell, "flex min-h-(--site-header-h) items-center py-2")}>
          <BrandLogo />
        </div>
      }
      footer={<BoardFooter />}
      mainId="content"
    >
      <div className="grid min-h-[50vh] place-items-center py-section text-center">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-lime">Error</p>
          <h1 className="mt-2 text-[clamp(28px,5vw,44px)] font-black tracking-tight">Something broke</h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-mut">{error.message || "An unexpected error occurred."}</p>
          <Button variant="primary" className="mt-6" onClick={() => retry()}>
            Try again
          </Button>
        </div>
      </div>
    </SiteShell>
  );
}
