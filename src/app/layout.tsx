import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: {
    default: "AI Tier Maker — Rank AI Models & Tools",
    template: "%s — AI Tier Maker",
  },
  description: "Drag-and-drop tier lists for AI models, coding agents, and creative tools. Export a PNG and share.",
  applicationName: "AI Tier Maker",
  keywords: ["AI", "tier list", "models", "coding agents", "ranking"],
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <a className="skip-link" href="#main">
          Skip to board
        </a>
        {children}
      </body>
    </html>
  );
}
