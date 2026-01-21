// app/api/cron/send-reminders/route.ts
// Scheduled job endpoint for sending 24h reservation reminders
//
// This endpoint should be called periodically (e.g., every hour) by a cron service.
// Examples of cron services:
// - Vercel Cron Jobs (https://vercel.com/docs/cron-jobs)
// - GitHub Actions scheduled workflows
// - External services like cron-job.org, EasyCron
// - System cron (crontab)
//
// For security, this endpoint should be protected by:
// 1. A secret token (CRON_SECRET env var)
// 2. Or IP allowlist
// 3. Or Vercel Cron authentication
//
// Example usage:
// curl -X POST https://your-domain.com/api/cron/send-reminders \
//   -H "Authorization: Bearer YOUR_CRON_SECRET"

import { NextRequest, NextResponse } from 'next/server';
import { sendReservationReminders } from '../../../../lib/reminder-service';
import { handleError } from '../../../../lib/api-utils';
import { logger } from '../../../../lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for the job

/**
 * POST /api/cron/send-reminders
 * Send 24-hour reminder emails for upcoming reservations
 *
 * This endpoint is designed to be called by a cron service.
 * It processes all reservations happening in ~24 hours and sends reminder emails.
 */
export async function POST(request: NextRequest) {
  try {
    // Security: Verify cron secret token
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret) {
      const token = authHeader?.replace('Bearer ', '');
      if (token !== cronSecret) {
        logger.warn('Unauthorized cron request', {
          hasAuthHeader: !!authHeader,
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        });
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    } else {
      // If no CRON_SECRET is set, log a warning but allow execution
      // This is for development/testing purposes only
      logger.warn('CRON_SECRET not set - endpoint is unprotected');
    }

    logger.info('Cron job started: send-reminders');

    const startTime = Date.now();
    const sentCount = await sendReservationReminders();
    const duration = Date.now() - startTime;

    logger.info('Cron job completed: send-reminders', {
      sentCount,
      duration: `${duration}ms`,
    });

    return NextResponse.json({
      success: true,
      sentCount,
      duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Cron job failed: send-reminders', {}, error instanceof Error ? error : new Error(String(error)));
    return handleError(error);
  }
}

/**
 * GET /api/cron/send-reminders
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    endpoint: 'send-reminders',
    description: 'Sends 24-hour reminder emails for upcoming reservations',
    method: 'POST',
    authentication: process.env.CRON_SECRET ? 'required' : 'disabled (dev mode)',
    schedule: 'Should be called every 1-6 hours',
  });
}
