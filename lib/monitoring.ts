// lib/monitoring.ts - Error monitoring integration (Sentry-ready)

import { logger } from './logger';

interface MonitoringContext {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
  request?: {
    method: string;
    url: string;
    headers?: Record<string, string>;
  };
  [key: string]: unknown;
}

class MonitoringService {
  private isEnabled: boolean;
  private sentryDsn: string | undefined;

  constructor() {
    this.sentryDsn = process.env.SENTRY_DSN;
    this.isEnabled = !!this.sentryDsn && process.env.NODE_ENV === 'production';

    if (this.isEnabled) {
      this.initializeSentry();
    }
  }

  private initializeSentry(): void {
    // This is a placeholder for Sentry initialization
    // In production, you would:
    // 1. npm install @sentry/nextjs
    // 2. Import and configure Sentry here
    // 3. Set SENTRY_DSN in environment variables

    logger.info('Monitoring service initialized', {
      service: 'sentry',
      dsn: this.sentryDsn ? 'configured' : 'missing',
    });

    // Example Sentry initialization (uncomment when Sentry is installed):
    /*
    import * as Sentry from '@sentry/nextjs';

    Sentry.init({
      dsn: this.sentryDsn,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      beforeSend(event) {
        // Filter out sensitive data
        if (event.request?.headers) {
          delete event.request.headers['cookie'];
          delete event.request.headers['authorization'];
        }
        return event;
      },
    });
    */
  }

  captureException(error: Error, context?: MonitoringContext): void {
    // Log the error locally
    logger.error('Exception captured', context, error);

    // Send to Sentry in production
    if (this.isEnabled) {
      // Example Sentry usage (uncomment when Sentry is installed):
      /*
      import * as Sentry from '@sentry/nextjs';

      Sentry.captureException(error, {
        user: context?.user,
        tags: {
          route: context?.request?.url,
          method: context?.request?.method,
        },
        extra: context,
      });
      */
    }
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error', context?: MonitoringContext): void {
    // Log the message locally
    logger[level === 'warning' ? 'warn' : level](message, context);

    // Send to Sentry in production
    if (this.isEnabled) {
      // Example Sentry usage (uncomment when Sentry is installed):
      /*
      import * as Sentry from '@sentry/nextjs';

      Sentry.captureMessage(message, {
        level,
        user: context?.user,
        extra: context,
      });
      */
    }
  }

  setUser(user: { id: string; email?: string; role?: string } | null): void {
    if (this.isEnabled && user) {
      // Example Sentry usage (uncomment when Sentry is installed):
      /*
      import * as Sentry from '@sentry/nextjs';

      Sentry.setUser({
        id: user.id,
        email: user.email,
        role: user.role,
      });
      */
    }
  }
}

export const monitoring = new MonitoringService();
