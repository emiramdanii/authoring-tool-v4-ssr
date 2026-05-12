import type { Metadata } from "next";
import { Geist, Geist_Mono, Fredoka, Nunito } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { StoreInit } from "@/components/providers/StoreInit";
import { ShortcutHelpOverlay } from "@/components/shared/ShortcutHelpOverlay";
import { SkipNavLink } from "@/components/shared/SkipNavLink";
import { LiveAnnouncer } from "@/components/shared/LiveAnnouncer";
import AutoSaveRecovery from "@/components/shared/AutoSaveRecovery";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Design system fonts for schema-driven rendering
const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Authoring Tool v4 — Media Pembelajaran Interaktif",
  description: "Aplikasi authoring tool untuk membuat media pembelajaran interaktif PPKn. Mendukung materi, kuis, game, skenario, dan desain canva.",
  keywords: ["authoring tool", "media pembelajaran", "PPKn", "interaktif", "kuis", "game edukasi", "Next.js"],
  authors: [{ name: "emiramdanii" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Authoring Tool v4 — Media Pembelajaran Interaktif",
    description: "Aplikasi authoring tool untuk membuat media pembelajaran interaktif PPKn.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Authoring Tool v4 — Media Pembelajaran Interaktif",
    description: "Aplikasi authoring tool untuk membuat media pembelajaran interaktif PPKn.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fredoka.variable} ${nunito.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          <SkipNavLink />
          <StoreInit />
          {children}
          <ShortcutHelpOverlay />
          <LiveAnnouncer />
          <AutoSaveRecovery />
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
