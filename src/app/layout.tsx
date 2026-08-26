import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/theme-provider";
import { themeBootScript } from "@/lib/theme";
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f6f4" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <Script id="theme-boot" strategy="beforeInteractive">
          {themeBootScript}
        </Script>
      </head>
      <body className="isolate min-h-full flex flex-col font-sans">
        <a
          className="absolute start-3 top-[-48px] z-[100] rounded-sm bg-lime px-3.5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-on-lime focus:top-3"
          href="#board"
        >
          Skip to board
        </a>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
