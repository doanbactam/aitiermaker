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
  description: "Make a tier list in minutes. Post the PNG on X — friends rank theirs at aitiermaker.com.",
  applicationName: "AI Tier Maker",
  keywords: ["AI", "tier list", "models", "coding agents", "ranking"],
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "oklch(0.972 0.003 106)" },
    { media: "(prefers-color-scheme: dark)", color: "oklch(0.141 0.008 286)" },
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
      <body className="isolate flex min-h-dvh flex-col font-sans">
        <a
          className="absolute start-3 top-[-48px] z-[100] rounded-sm bg-lime px-3.5 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-on-lime focus:top-3"
          href="#board"
        >
          Skip to board
        </a>
        <ThemeProvider>
          <div className="flex min-h-dvh flex-1 flex-col">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
