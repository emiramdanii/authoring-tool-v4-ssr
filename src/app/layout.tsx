import type { Metadata } from "next";
import { Geist, Geist_Mono, Fredoka, Nunito } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { A11yProvider } from "@/components/providers/A11yProvider";
import { StoreInit } from "@/components/providers/StoreInit";
import { ShortcutHelpOverlay } from "@/components/shared/ShortcutHelpOverlay";
import { SkipNavLink } from "@/components/shared/SkipNavLink";
import { LiveAnnouncer } from "@/components/shared/LiveAnnouncer";
import AutoSaveRecovery from "@/components/shared/AutoSaveRecovery";
import { SafeModeBanner } from "@/components/shared/SafeModeBanner";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
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
  manifest: "/manifest.json",
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
      <head>
        <meta name="theme-color" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SILSE" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fredoka.variable} ${nunito.variable} antialiased bg-background text-foreground`}
      >
        <AppErrorBoundary>
          <SafeModeBanner />
          <ThemeProvider>
            <A11yProvider>
              <SkipNavLink />
              <StoreInit />
              {children}
              <ShortcutHelpOverlay />
              <LiveAnnouncer />
              <AutoSaveRecovery />
            </A11yProvider>
          </ThemeProvider>
        </AppErrorBoundary>
        <Toaster />
      </body>
    </html>
  );
}
