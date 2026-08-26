import TierMaker from "@/components/tier-maker";
import type { Metadata } from "next";
import { decodeState, shareCaption } from "@/lib/state";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const s = typeof sp.s === "string" ? sp.s : undefined;
  const state = s ? decodeState(s) : null;
  const og = `/og${s ? `?s=${encodeURIComponent(s)}` : ""}`;
  const title = state ? `${state.t} — AI Tier Maker` : "AI Tier Maker — Rank AI Models & Tools";
  const description = state
    ? shareCaption(state)
    : "Drag-and-drop tier lists for AI models, coding agents, and creative tools. Share a link — preview renders on the server.";
  return {
    title,
    description,
    openGraph: { title, description, images: [og] },
    twitter: { card: "summary_large_image", title, description, images: [og] },
  };
}

export default function Home() {
  return <TierMaker />;
}
