'use client';

import { useTheme } from 'next-themes';
import { useCallback, useEffect, useState } from 'react';

/**
 * App-wide theme hook — wraps next-themes with semantic helpers.
 *
 * - `theme` / `resolvedTheme`: current theme ('dark' | 'light')
 * - `toggleTheme()`: switch between dark and light
 * - `isDark` / `isLight`: boolean convenience flags
 * - `mounted`: whether the component has mounted (avoid hydration mismatch)
 */
export function useAppTheme() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === 'dark' : false; // default light during SSR
  const isLight = mounted ? resolvedTheme === 'light' : true;

  const toggleTheme = useCallback(() => {
    setTheme(isDark ? 'light' : 'dark');
  }, [isDark, setTheme]);

  return {
    theme: resolvedTheme ?? 'light',
    isDark,
    isLight,
    toggleTheme,
    setTheme,
    mounted,
  } as const;
}
