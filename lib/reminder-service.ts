// lib/reminder-service.ts - Reservation reminder service
// Handles automatic 24-hour reminder emails for upcoming reservations

import { prisma } from './prisma';
import { emailService } from './email';
import { logger } from './logger';
import { ReservationStatus } from '../types';

/**
 * Send reminder emails for reservations happening in ~24 hours
 *
 * This function:
 * 1. Finds CONFIRMED reservations happening in 23-25 hours from now
 * 2. Filters out reservations that already received a reminder
 * 3. Sends reminder email to each user
 * 4. Marks the reservation as reminded (reminderSentAt)
 *
 * Safe to run multiple times - duplicates are prevented by reminderSentAt field
 *
 * @returns Number of reminders sent
 */
export async function sendReservationReminders(): Promise<number> {
  try {
    // Calculate tomorrow's date in UTC (reservations are stored as UTC dates)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);

    const targetDate = tomorrow;

    logger.info('Running reminder job', {
      targetDate: targetDate.toISOString(),
    });

    // Find CONFIRMED reservations for tomorrow that haven't been reminded yet
    const reservations = await prisma.reservation.findMany({
      where: {
        date: targetDate,
        status: ReservationStatus.CONFIRMED,
        reminderSentAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    logger.info(`Found ${reservations.length} reservations needing reminders`);

    let sentCount = 0;

    // Send reminder for each reservation
    for (const reservation of reservations) {
      try {
        // Send reminder email
        await emailService.sendReservationReminder({
          to: reservation.user.email,
          name: `${reservation.user.firstName} ${reservation.user.lastName}`,
          date: reservation.date,
          slot: reservation.slot,
          reservationId: reservation.id,
          language: 'fr', // Default to French
        });

        // Mark as reminded
        await prisma.reservation.update({
          where: { id: reservation.id },
          data: { reminderSentAt: new Date() },
        });

        sentCount++;

        logger.info('Reminder sent', {
          reservationId: reservation.id,
          userId: reservation.user.id,
          email: reservation.user.email,
          date: reservation.date.toISOString(),
          slot: reservation.slot,
        });
      } catch (error) {
        // Log error but continue with other reminders
        logger.error('Failed to send reminder', {
          reservationId: reservation.id,
          userId: reservation.user.id,
        }, error instanceof Error ? error : new Error(String(error)));
      }
    }

    logger.info('Reminder job completed', {
      total: reservations.length,
      sent: sentCount,
      failed: reservations.length - sentCount,
    });

    return sentCount;
  } catch (error) {
    logger.error('Reminder job failed', {}, error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}
