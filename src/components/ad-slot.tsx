"use client";

import { ArrowUpRight } from "lucide-react";
import type { Ad } from "@/data/ads";
import { Mark } from "@/components/tile";
import { cn } from "@/lib/cn";

const sponsoredLabel = "font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-mut2";

/**
 * The single ad presentation. Both placements use it, so a sponsor looks the
 * same wherever it lands and the page keeps one visual rhythm.
 *
 * Deliberately quiet: no accent bar, no tinted background, no shadow. Tier
 * colours are the only strong colour on the board and an ad should not compete
 * with them.
 */
function AdCard({ ad, className }: { ad: Ad; className?: string }) {
  return (
    <a
      href={ad.url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      referrerPolicy="strict-origin-when-cross-origin"
      className={cn(
        "group flex items-center gap-control rounded-md border border-line bg-panel px-3 py-2.5 text-inherit no-underline",
        "transition-colors duration-150 hover:border-line2 hover:bg-panel2",
        className,
      )}
    >
      <Mark domain={ad.domain} name={ad.name} size={24} />
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold leading-tight">{ad.name}</span>
        <span className="mt-0.5 block text-xs leading-snug text-mut">{ad.tagline}</span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-mut transition-colors group-hover:text-fg">
        <span className="max-sm:sr-only">{ad.cta ?? "Open"}</span>
        <ArrowUpRight size={11} aria-hidden="true" />
      </span>
    </a>
  );
}

/** One card in the board's mid slot, inside the reading column. */
export function AdMidBlock({ ad }: { ad: Ad }) {
  return (
    <aside className="flex flex-col gap-inset" aria-label={`Sponsored: ${ad.name}`}>
      <span className={sponsoredLabel}>Sponsored</span>
      <AdCard ad={ad} />
    </aside>
  );
}

/**
 * Sponsor list. Mounted after the board, not before it: above the board it
 * pushed the first tier below the fold on small screens.
 */
export function AdSponsors({ ads }: { ads: Ad[] }) {
  if (!ads.length) return null;
  return (
    <section className="mt-section" aria-label="Sponsored tools">
      <h2 className={cn(sponsoredLabel, "mb-inset")}>Sponsored</h2>
      <ul className="flex flex-col gap-inset">
        {ads.map((ad) => (
          <li key={ad.id}>
            <AdCard ad={ad} />
          </li>
        ))}
      </ul>
    </section>
  );
}
