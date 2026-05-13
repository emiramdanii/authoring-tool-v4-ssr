'use client';

import { Moon, Sun } from 'lucide-react';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

/**
 * ThemeToggle — Switches between dark and light mode.
 * Uses the unified ThemeProvider (next-themes) which toggles
 * both shadcn CSS vars and semantic tokens simultaneously.
 *
 * Keyboard shortcut: Ctrl+Shift+T (registered globally)
 */
export function ThemeToggle() {
  const { isDark, toggleTheme, mounted } = useAppTheme();

  // Register global keyboard shortcut Ctrl+Shift+T
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        toggleTheme();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTheme]);

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
      title={isDark ? 'Switch to light mode (Ctrl+Shift+T)' : 'Switch to dark mode (Ctrl+Shift+T)'}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-app-secondary" />
      ) : (
        <Moon className="h-4 w-4 text-app-secondary" />
      )}
    </Button>
  );
}
