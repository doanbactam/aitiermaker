import Link from "next/link";
import { cn } from "@/lib/cn";
import { brandMark, btnPrimary, layoutShell, siteHeader } from "@/lib/ui-styles";

function Brand() {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5 text-[15px] font-extrabold tracking-tight text-inherit no-underline">
      <span className={brandMark} aria-hidden="true" />
      AI TIER MAKER<span className="text-lime">.</span>
    </Link>
  );
}

export default function NotFound() {
  return (
    <>
      <header className={siteHeader}>
        <div className={cn(layoutShell, "flex items-center py-3")}>
          <Brand />
        </div>
      </header>
      <main className="grid min-h-[70vh] place-items-center px-5 py-10 text-center">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-lime">404</p>
          <h1 className="mt-2 text-[clamp(28px,5vw,44px)] font-black tracking-tight">Page not found</h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-mut">That route does not exist. Head back to the board.</p>
          <Link href="/" className={cn(btnPrimary, "btn-part mt-6 inline-flex")}>
            Back to AI Tier Maker
          </Link>
        </div>
      </main>
    </>
  );
}
