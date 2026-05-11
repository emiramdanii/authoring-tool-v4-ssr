'use client';

import { Moon, Sun } from 'lucide-react';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Button } from '@/components/ui/button';

/**
 * ThemeToggle — Switches between dark and light mode.
 * Uses the unified ThemeProvider (next-themes) which toggles
 * both shadcn CSS vars and semantic tokens simultaneously.
 *
 * Placeholder: In Sprint 3, this will be integrated into the
 * StatusBar with keyboard shortcut support.
 */
export function ThemeToggle() {
  const { isDark, toggleTheme, mounted } = useAppTheme();

  // Avoid hydration mismatch — render a skeleton until mounted
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-app-secondary" />
      ) : (
        <Moon className="h-4 w-4 text-app-secondary" />
      )}
    </Button>
  );
}
