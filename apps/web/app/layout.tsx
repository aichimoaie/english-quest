import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { AppShell } from "@/components/ui/AppShell";
import { IconSprite } from "@/components/ui/IconSprite";
import { Providers } from "./providers";

// Self-hosted at build time, so the static export serves the font itself.
const nunito = Nunito({ subsets: ["latin"], weight: ["500", "700", "800"], display: "swap", variable: "--font-nunito" });

export const metadata: Metadata = {
  title: { default: "English Quest", template: "%s · English Quest" },
  description: "A 30-day English course. One short, focused session a day.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8ff" },
    { media: "(prefers-color-scheme: dark)", color: "#151226" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={nunito.variable}>
      <body>
        <Providers>
          <IconSprite />
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
