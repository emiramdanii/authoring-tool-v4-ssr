'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export function SafeModeBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if we booted in safe mode
    const safeModeFlag = sessionStorage.getItem('silse_safe_mode');
    if (safeModeFlag === '1') {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[150] bg-amber-500/90 text-amber-950 px-4 py-1.5 flex items-center justify-between text-xs font-medium backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <AlertTriangle size={14} className="shrink-0" />
        <span>Mode Aman aktif — beberapa data diperbaiki otomatis</span>
      </div>
      <button
        onClick={() => { setVisible(false); sessionStorage.removeItem('silse_safe_mode'); }}
        className="hover:bg-amber-600/30 rounded p-0.5 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}
