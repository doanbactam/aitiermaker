import TierMaker from "@/components/tier-maker";
import type { Metadata } from "next";

const title = "AI Tier Maker — Rank AI Models & Tools";
const description = "Make a tier list in minutes. Post the PNG on X — friends rank theirs at aitiermaker.com.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, images: ["/og"] },
  twitter: { card: "summary_large_image", title, description, images: ["/og"] },
};

export default function Home() {
  return <TierMaker />;
}
