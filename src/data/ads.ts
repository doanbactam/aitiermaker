export type AdSlot = "flank" | "carousel" | "mid-board" | "feed";

export type AdTier = "standard" | "premium";

export interface Ad {
  id: string;
  slots: AdSlot[];
  name: string;
  tagline: string;
  url: string;
  domain: string;
  cta?: string;
  accent?: string;
  tier?: AdTier;
  /** Mid-board iframe embed (TrustMRR DataFast pattern). */
  embedUrl?: string;
  /** Activity-feed copy (TrustMRR “What's happening?”). */
  feedText?: string;
  author?: string;
}

/** Self-serve or affiliate placements — edit here, no code changes needed. */
export const ADS: Ad[] = [
  {
    id: "datafast",
    slots: ["flank", "mid-board", "carousel"],
    name: "DataFast",
    tagline: "Analytics founders actually open — revenue, traffic, goals.",
    url: "https://datafa.st/?ref=aitiermaker",
    domain: "datafa.st",
    cta: "Start free",
    accent: "#74c0fc",
    tier: "premium",
    embedUrl: "https://datafa.st/demo?ref=aitiermaker",
  },
  {
    id: "cursor",
    slots: ["flank", "carousel", "feed"],
    name: "Cursor",
    tagline: "AI code editor — rank tools, then ship with agents.",
    url: "https://cursor.com",
    domain: "cursor.com",
    cta: "Try Cursor",
    accent: "#c8f04b",
    tier: "premium",
    author: "Cursor",
    feedText: "Rank your stack here, then jump back to the editor — agents keep context while you ship.",
  },
  {
    id: "shipfast",
    slots: ["carousel", "feed"],
    name: "ShipFast",
    tagline: "Next.js boilerplate to launch your AI side project this week.",
    url: "https://shipfa.st",
    domain: "shipfa.st",
    cta: "See template",
    accent: "#ffa94d",
    author: "Marc Lou",
    feedText: "Just shipped another tier-list template hook — rank tools, share a link, collect signups.",
  },
  {
    id: "perplexity",
    slots: ["carousel", "feed"],
    name: "Perplexity",
    tagline: "Research models and vendors before you rank them.",
    url: "https://perplexity.ai",
    domain: "perplexity.ai",
    cta: "Search",
    accent: "#51cf66",
    author: "Perplexity",
    feedText: "Not sure where a model belongs? Pull fresh benchmarks before you drop it in S-tier.",
  },
];
