'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';

/**
 * Unified ThemeProvider — bridges shadcn + semantic token systems.
 *
 * - Toggles `.dark` class on <html> → activates shadcn dark-mode CSS vars
 * - `.dark` class also activates semantic dark-mode overrides (see globals.css)
 * - Default: dark mode (matches the app's existing dark-first design)
 *
 * Usage: Wrap your root layout's {children} with <ThemeProvider>
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
