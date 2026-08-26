import TierMaker from "@/components/tier-maker";
import type { Metadata } from "next";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const s = typeof sp.s === "string" ? sp.s : undefined;
  const og = `/og${s ? `?s=${encodeURIComponent(s)}` : ""}`;
  return {
    title: "AI Tier Maker — Rank AI Models & Tools",
    description: "Drag-and-drop tier lists for AI models, coding agents, and creative tools. Export a PNG and share.",
    openGraph: { images: [og] },
    twitter: { card: "summary_large_image", images: [og] },
  };
}

export default function Home() {
  return <TierMaker />;
}
