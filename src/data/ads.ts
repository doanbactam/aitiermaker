export type AdSlot = "mid-board" | "list";

export interface Ad {
  id: string;
  /** Slots this ad may fill. It is placed in at most one of them per page. */
  slots: AdSlot[];
  name: string;
  tagline: string;
  url: string;
  domain: string;
  cta?: string;
}

/**
 * Self-serve or affiliate placements — edit here, no code changes needed.
 *
 * Keep taglines factual and first-party: this list is rendered as a labelled
 * sponsor slot, not as user activity or an endorsement.
 */
export const ADS: Ad[] = [
  {
    id: "datafast",
    slots: ["mid-board", "list"],
    name: "DataFast",
    tagline: "Analytics founders actually open — revenue, traffic, goals.",
    url: "https://datafa.st/?ref=aitiermaker",
    domain: "datafa.st",
    cta: "Start free",
  },
  {
    id: "cursor",
    slots: ["mid-board", "list"],
    name: "Cursor",
    tagline: "AI code editor — rank the tools, then ship with agents.",
    url: "https://cursor.com",
    domain: "cursor.com",
    cta: "Try Cursor",
  },
  {
    id: "shipfast",
    slots: ["list"],
    name: "ShipFast",
    tagline: "Next.js boilerplate to launch your AI side project this week.",
    url: "https://shipfa.st",
    domain: "shipfa.st",
    cta: "See template",
  },
  {
    id: "perplexity",
    slots: ["list"],
    name: "Perplexity",
    tagline: "Research models and vendors before you rank them.",
    url: "https://perplexity.ai",
    domain: "perplexity.ai",
    cta: "Search",
  },
];
