import type { Metadata } from "next";
// OPTIMIZE-LAST-01: Font diet — removed Geist + Geist Mono (5 → 3 fonts).
// Plus Jakarta Sans now serves as the primary --font-sans. Fredoka and
// Nunito remain for schema-driven design system (display + body variants).
import { Fredoka, Nunito, Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { A11yProvider } from "@/components/providers/A11yProvider";
import { StoreInit } from "@/components/providers/StoreInit";
// BATCH-12-03: ShortcutHelpOverlay moved to legacy-disabled (depends on
// quarantined shortcuts/ module). V5 doesn't use keyboard shortcuts.
// import { ShortcutHelpOverlay } from "@/components/shared/ShortcutHelpOverlay";
import { SkipNavLink } from "@/components/shared/SkipNavLink";
import { LiveAnnouncer } from "@/components/shared/LiveAnnouncer";
import AutoSaveRecovery from "@/components/shared/AutoSaveRecovery";
import { SafeModeBanner } from "@/components/shared/SafeModeBanner";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { Toaster } from "sonner";
import "./globals.css";

// OPTIMIZE-LAST-01: Plus Jakarta Sans is now the primary sans-serif.
// The --font-geist-sans CSS var is kept for backward compat (mapped to
// Plus Jakarta in globals.css) so existing component styles that reference
// var(--font-sans) keep working without a sweeping refactor.
const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
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
    images: ['/og.png'],
  },
  twitter: {
    card: "summary_large_image",
    title: "Authoring Tool v4 — Media Pembelajaran Interaktif",
    description: "Aplikasi authoring tool untuk membuat media pembelajaran interaktif PPKn.",
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#006c49" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SILSE" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        {/* Material Symbols Outlined — SILSE v4 icon system */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'SILSE — Media Pembelajaran Interaktif',
              description: 'Aplikasi authoring tool untuk membuat media pembelajaran interaktif sesuai standar BSNP dan Kurikulum Merdeka.',
              applicationCategory: 'EducationalApplication',
              operatingSystem: 'Web',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'IDR',
              },
              author: {
                '@type': 'Person',
                name: 'emiramdanii',
              },
              featureList: [
                '40+ jenis blok interaktif',
                'Kuis, game, dan skenario',
                'Export HTML dan SCORM',
                'AI content generation',
                'BSNP compliance checker',
              ],
            }),
          }}
        />
      </head>
      <body
        className={`${fredoka.variable} ${nunito.variable} ${plusJakarta.variable} antialiased bg-background text-foreground`}
      >
        <AppErrorBoundary>
          <SafeModeBanner />
          <ThemeProvider>
            <A11yProvider>
              <SkipNavLink />
              <StoreInit />
              <div id="main-content">
                {children}
              </div>
              {/* BATCH-12-03: ShortcutHelpOverlay quarantined — V5 doesn't use keyboard shortcuts */}
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
