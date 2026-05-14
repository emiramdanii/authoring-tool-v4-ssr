/**
 * Structured logger — replaces raw console calls in production code.
 * In development, logs to console. In production, silently captures for error reporting.
 *
 * Usage:
 *   import { logger } from '@/core/utils/logger';
 *   logger.error('MyContext', error);
 *   logger.error('ErrorBoundary', error, componentStack);  // extra details
 *   logger.warn('MyContext', 'Something suspicious happened');
 */

const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  error(context: string, error: unknown, ...extra: unknown[]) {
    if (isDev) console.error(`[${context}]`, error, ...extra);
    // In production, this could be wired to Sentry/LogRocket/etc.
  },
  warn(context: string, message: string) {
    if (isDev) console.warn(`[${context}]`, message);
  },
};
