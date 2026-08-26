"use client";

import { ArrowUpRight } from "lucide-react";
import type { Ad } from "@/data/ads";
import { Mark } from "@/components/tile";
import { cn } from "@/lib/cn";

function premiumBg(ad: Ad): string | undefined {
  if (ad.tier !== "premium" || !ad.accent) return undefined;
  return `color-mix(in srgb, ${ad.accent} 14%, var(--color-panel))`;
}

function AdLink({ ad, className, style, children }: { ad: Ad; className?: string; style?: React.CSSProperties; children: React.ReactNode }) {
  return (
    <a className={className} style={style} href={ad.url} target="_blank" rel="noopener noreferrer sponsored">
      {children}
    </a>
  );
}

/** Fixed cards in the side margin lanes (TrustMRR uses lg:mx-[16.666%] — ads live in the flanks). */
export function AdFlank({ ads }: { ads: Ad[] }) {
  if (!ads.length) return null;
  const [leading, trailing] = ads;
  return (
    <>
      {leading ? (
        <aside
          className="pointer-events-none fixed top-[calc(58px+1rem)] z-40 hidden w-[min(11rem,12vw)] 2xl:block"
          style={{ insetInlineStart: "max(1rem, calc((100vw - 66.666vw) / 2 - 12rem))" }}
          aria-label={`Sponsored: ${leading.name}`}
        >
          <AdFlankCard ad={leading} className="pointer-events-auto" />
        </aside>
      ) : null}
      {trailing && trailing.id !== leading?.id ? (
        <aside
          className="pointer-events-none fixed top-[calc(58px+1rem)] z-40 hidden w-[min(11rem,12vw)] 2xl:block"
          style={{ insetInlineEnd: "max(1rem, calc((100vw - 66.666vw) / 2 - 12rem))" }}
          aria-label={`Sponsored: ${trailing.name}`}
        >
          <AdFlankCard ad={trailing} className="pointer-events-auto" />
        </aside>
      ) : null}
    </>
  );
}

function AdFlankCard({ ad, className }: { ad: Ad; className?: string }) {
  return (
    <AdLink
      ad={ad}
      className={cn(
        "flex flex-col gap-2 rounded-md border border-line bg-panel p-3 text-inherit no-underline shadow-pop transition-[border-color,transform] duration-150 hover:border-line2 hover:-translate-y-px",
        className,
      )}
      style={{ background: premiumBg(ad) }}
    >
      <span className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-mut2">Sponsored</span>
      <div className="flex items-center gap-2">
        <Mark domain={ad.domain} name={ad.name} size={24} />
        <span className="text-[13px] font-bold leading-tight">{ad.name}</span>
      </div>
      <p className="text-[11px] leading-snug text-mut">{ad.tagline}</p>
      <span className="inline-flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-[0.06em] text-lime">
        {ad.cta ?? "Open"}
        <ArrowUpRight size={11} aria-hidden="true" />
      </span>
    </AdLink>
  );
}

/** Horizontal snap carousel — TrustMRR “Recently listed” pattern. */
export function AdCarousel({ ads, title = "Tools worth a look" }: { ads: Ad[]; title?: string }) {
  if (!ads.length) return null;
  return (
    <section className="mt-section" aria-label="Sponsored tools">
      <div className="mb-control flex items-baseline justify-between gap-group">
        <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-mut">{title}</h2>
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-mut2">Sponsored</span>
      </div>
      <div className="-mx-[max(var(--layout-gutter),env(safe-area-inset-left))] flex snap-x snap-mandatory gap-control overflow-x-auto px-[max(var(--layout-gutter),env(safe-area-inset-left))] pb-1 scroll-ps-[max(var(--layout-gutter),env(safe-area-inset-left))] [scrollbar-width:thin]">
        {ads.map((ad) => (
          <AdLink
            key={ad.id}
            ad={ad}
            className="relative flex w-[min(17rem,78%)] shrink-0 snap-start flex-col gap-2 rounded-md border border-line bg-panel p-3.5 text-inherit no-underline transition-[border-color,transform] duration-150 hover:border-line2 hover:-translate-y-px"
            style={{ background: premiumBg(ad) }}
          >
            <span className="absolute inset-x-0 top-0 h-[3px] rounded-t-md" style={{ background: ad.accent ?? "var(--color-line2)" }} aria-hidden="true" />
            {ad.tier === "premium" ? (
              <span className="mt-1 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-mut2">Sponsored</span>
            ) : null}
            <div className="flex items-center gap-2.5">
              <Mark domain={ad.domain} name={ad.name} size={28} />
              <span className="text-sm font-bold">{ad.name}</span>
            </div>
            <p className="flex-1 text-xs leading-snug text-mut">{ad.tagline}</p>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.06em] text-lime">{ad.cta ?? "Open"}</span>
          </AdLink>
        ))}
      </div>
    </section>
  );
}

/** Mid-list sponsor block — TrustMRR DataFast iframe + “Powered by” pill. */
export function AdMidBlock({ ad }: { ad: Ad }) {
  return (
    <aside className="overflow-hidden rounded-md border border-line bg-panel" aria-label={`Sponsored: ${ad.name}`}>
      <div className="relative">
        {ad.embedUrl ? (
          <iframe className="h-[min(280px,42vw)] w-full border-0" loading="lazy" title={`${ad.name} preview`} src={ad.embedUrl} />
        ) : (
          <div className="flex items-center gap-group p-4">
            <Mark domain={ad.domain} name={ad.name} size={32} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{ad.name}</p>
              <p className="text-xs text-mut">{ad.tagline}</p>
            </div>
          </div>
        )}
        <AdLink
          ad={ad}
          className="absolute bottom-3 end-3 inline-flex items-center gap-2 rounded-full bg-[color-mix(in_srgb,var(--color-bg)_75%,transparent)] px-3 py-1.5 text-fg shadow-pop ring-1 ring-line2 backdrop-blur-sm transition-[background] duration-100 hover:bg-panel2"
        >
          <Mark domain={ad.domain} name={ad.name} size={18} />
          <span className="text-xs font-medium">Powered by {ad.name}</span>
        </AdLink>
      </div>
    </aside>
  );
}

/** Activity feed promos — TrustMRR “What's happening?” pattern. */
export function AdActivityFeed({ ads }: { ads: Ad[] }) {
  if (!ads.length) return null;
  return (
    <section className="mt-section rounded-md border border-line bg-panel p-group" aria-label="Sponsored updates">
      <div className="mb-control flex items-baseline justify-between gap-group">
        <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-mut">What&apos;s happening?</h2>
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-mut2">Sponsored</span>
      </div>
      <ul className="flex flex-col divide-y divide-line">
        {ads.map((ad) => (
          <li key={ad.id}>
            <AdLink ad={ad} className="flex gap-3 py-3 text-inherit no-underline transition-colors hover:bg-panel2/60">
              <Mark domain={ad.domain} name={ad.name} size={32} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] leading-snug">
                  <span className="font-semibold">{ad.author ?? ad.name}</span>
                  <span className="text-mut"> on </span>
                  <span className="font-semibold">{ad.name}</span>
                </p>
                <p className="mt-1 text-xs leading-relaxed text-mut">{ad.feedText ?? ad.tagline}</p>
              </div>
            </AdLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
