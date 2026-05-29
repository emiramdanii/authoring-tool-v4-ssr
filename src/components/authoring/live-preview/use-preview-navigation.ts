'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useCanvaStore } from '@/store/canva-store';

export interface UsePreviewNavigationReturn {
  activeScreen: string;
  activeSlide: number;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  handleScreenSelect: (screenId: string) => void;
  handleSlideSelect: (slideIdx: number) => void;
  handleOpenInNewTab: (htmlContent: string) => void;
}

export function usePreviewNavigation(): UsePreviewNavigationReturn {
  // ── Local state ────────────────────────────────────────────
  const [activeScreen, setActiveScreen] = useState('s-cover');
  const [activeSlide, setActiveSlide] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // ── Listen for postMessage from iframe ─────────────────────
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      // Template/Legacy: screen navigation sync
      if (e.data?.type === 'screenChange' && e.data.screen) {
        setActiveScreen(e.data.screen);
      }
      // Canvas: slide navigation sync
      if (e.data?.type === 'canvasSlideChange' && typeof e.data.slide === 'number') {
        setActiveSlide(e.data.slide);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // ── Navigation handlers ────────────────────────────────────
  const handleScreenSelect = useCallback((screenId: string) => {
    setActiveScreen(screenId);
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'navigateTo', screen: screenId }, '*');
    }
  }, []);

  const handleSlideSelect = useCallback((slideIdx: number) => {
    setActiveSlide(slideIdx);
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'goSlide', slide: slideIdx }, '*');
    }
  }, []);

  // ── Open preview in new browser tab ────────────────────────
  const handleOpenInNewTab = useCallback((htmlContent: string) => {
    if (!htmlContent) return;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(htmlContent);
      win.document.close();
    }
  }, []);

  return {
    activeScreen,
    activeSlide,
    iframeRef,
    handleScreenSelect,
    handleSlideSelect,
    handleOpenInNewTab,
  };
}
