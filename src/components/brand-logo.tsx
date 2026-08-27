import Link from "next/link";
import { cn } from "@/lib/cn";

function BrandIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("size-[22px] shrink-0", className)} aria-hidden="true">
      <rect x="1" y="1" width="22" height="22" rx="6" fill="var(--color-panel2)" stroke="var(--color-line)" strokeWidth="1" />
      <rect x="4" y="5" width="3.5" height="14" rx="1" fill="var(--color-lime)" />
      <rect x="9.5" y="6" width="10" height="2.75" rx="0.75" fill="#ef5350" />
      <rect x="9.5" y="10.125" width="7.5" height="2.75" rx="0.75" fill="#f59f3d" />
      <rect x="9.5" y="14.25" width="5.5" height="2.75" rx="0.75" fill="#e8c547" />
    </svg>
  );
}

type BrandLogoProps = {
  className?: string;
  /** Link to home. Off for loading chrome that is not interactive yet. */
  asLink?: boolean;
};

export function BrandLogo({ className, asLink = true }: BrandLogoProps) {
  const mark = (
    <>
      <BrandIcon />
      <span className="min-w-0 leading-none max-[419px]:hidden">
        <span className="block font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-lime">AI</span>
        <span className="block text-[13px] font-bold tracking-[-0.03em] text-fg">Tier Maker</span>
      </span>
    </>
  );

  const classes = cn("inline-flex items-center gap-2 min-w-0", className);

  if (asLink) {
    return (
      <Link href="/" className={cn(classes, "rounded-sm text-inherit no-underline outline-offset-4")} aria-label="AI Tier Maker home">
        {mark}
      </Link>
    );
  }

  return <span className={classes}>{mark}</span>;
}
