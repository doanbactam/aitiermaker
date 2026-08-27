import Link from "next/link";
import { BoardFooter } from "@/components/board-footer";
import { BrandLogo } from "@/components/brand-logo";
import { SiteShell } from "@/components/site-shell";
import { cn } from "@/lib/cn";
import { btnPrimary, layoutShell } from "@/lib/ui-styles";

export default function NotFound() {
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
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-lime">404</p>
          <h1 className="mt-2 text-[clamp(28px,5vw,44px)] font-black tracking-tight">Page not found</h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-mut">That route does not exist. Head back to the board.</p>
          <Link href="/" className={cn(btnPrimary, "btn-part mt-6 inline-flex")}>
            Back to AI Tier Maker
          </Link>
        </div>
      </div>
    </SiteShell>
  );
}
