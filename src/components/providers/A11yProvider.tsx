'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface A11yContextType {
  reducedMotion: boolean;
  highContrast: boolean;
}

const A11yContext = createContext<A11yContextType>({
  reducedMotion: false,
  highContrast: false,
});

export const useA11yPreferences = () => useContext(A11yContext);

export function A11yProvider({ children }: { children: ReactNode }) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const contrastQuery = window.matchMedia('(prefers-contrast: more)');
    
    setReducedMotion(motionQuery.matches);
    setHighContrast(contrastQuery.matches);
    
    const motionHandler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    const contrastHandler = (e: MediaQueryListEvent) => setHighContrast(e.matches);
    
    motionQuery.addEventListener('change', motionHandler);
    contrastQuery.addEventListener('change', contrastHandler);
    
    // Apply classes to html element
    const updateClasses = () => {
      const html = document.documentElement;
      html.classList.toggle('reduced-motion', motionQuery.matches);
      html.classList.toggle('high-contrast', contrastQuery.matches);
    };
    updateClasses();
    
    return () => {
      motionQuery.removeEventListener('change', motionHandler);
      contrastQuery.removeEventListener('change', contrastHandler);
    };
  }, []);

  return (
    <A11yContext.Provider value={{ reducedMotion, highContrast }}>
      {children}
    </A11yContext.Provider>
  );
}
