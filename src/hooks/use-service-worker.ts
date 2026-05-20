'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { logger } from '@/core/utils/logger';

/**
 * Service Worker Registration Hook
 *
 * Registers the service worker on mount (production only).
 * Handles:
 *   - Update notifications: shows toast when new version available
 *   - Offline/online status changes: shows appropriate toasts
 *
 * Returns:
 *   - isOnline: current network status
 *   - swStatus: service worker registration status
 */

export type SWStatus = 'idle' | 'registering' | 'registered' | 'update-available' | 'error';

export function useServiceWorker() {
  const [isOnline, setIsOnline] = useState(true);
  const [swStatus, setSwStatus] = useState<SWStatus>('idle');
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  // ── Register service worker ─────────────────────────────────
  useEffect(() => {
    // Only register in production
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    const registerSW = async () => {
      try {
        setSwStatus('registering');
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        registrationRef.current = registration;
        setSwStatus('registered');

        // Check for updates periodically
        setInterval(() => {
          registration.update().catch(() => {
            // Silently fail — not critical
          });
        }, 60 * 60 * 1000); // Check every hour

        // Handle update found
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              setSwStatus('update-available');
              toast.info('Versi baru tersedia! Klik untuk update.', {
                duration: 10000,
                action: {
                  label: 'Update',
                  onClick: () => {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                  },
                },
              });
            }
          });
        });
      } catch (error) {
        logger.warn('SW', 'Registration failed: ' + String(error));
        setSwStatus('error');
      }
    };

    registerSW();

    // Handle controller change (after skipWaiting)
    const handleControllerChange = () => {
      // New service worker took over — reload for fresh content
      window.location.reload();
    };

    navigator.serviceWorker?.addEventListener('controllerchange', handleControllerChange);

    return () => {
      navigator.serviceWorker?.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  // ── Monitor online/offline status ───────────────────────────
  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Kembali online! Menyinkronkan data...', { duration: 3000 });
      // Dispatch custom event for offline-sync to pick up
      window.dispatchEvent(new CustomEvent('silse-online'));
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Anda sedang offline. Data tersimpan di perangkat.', { duration: 5000 });
      // Dispatch custom event for offline-sync to pick up
      window.dispatchEvent(new CustomEvent('silse-offline'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ── Manual update check ─────────────────────────────────────
  const checkForUpdate = useCallback(async () => {
    if (registrationRef.current) {
      try {
        await registrationRef.current.update();
      } catch {
        // Silently fail
      }
    }
  }, []);

  return { isOnline, swStatus, checkForUpdate };
}
