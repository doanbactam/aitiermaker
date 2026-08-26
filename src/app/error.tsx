"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { brandMark, layoutShell, siteHeader } from "@/lib/ui-styles";
import { cn } from "@/lib/cn";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <>
      <header className={siteHeader}>
        <div className={cn(layoutShell, "flex items-center py-3")}>
          <Link href="/" className="inline-flex items-center gap-2.5 text-[15px] font-extrabold tracking-tight text-inherit no-underline">
            <span className={brandMark} aria-hidden="true" />
            AI TIER MAKER<span className="text-lime">.</span>
          </Link>
        </div>
      </header>
      <main className="grid min-h-[70vh] place-items-center px-5 py-10 text-center">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-lime">Error</p>
          <h1 className="mt-2 text-[clamp(28px,5vw,44px)] font-black tracking-tight">Something broke</h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-mut">{error.message || "An unexpected error occurred."}</p>
          <Button variant="primary" className="mt-6" onClick={() => retry()}>
            Try again
          </Button>
        </div>
      </main>
    </>
  );
}
