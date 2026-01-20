// ReservationService.ts - Core booking business logic

import { PrismaClient } from '@prisma/client';
import {
  SlotType,
  ReservationStatus,
  ReservationError,
  Result,
  Reservation,
  CoworkingSettings,
} from './types';

export class ReservationService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Check availability for a specific date and slot
   * Returns the number of desks still available
   */
  async checkAvailability(
    date: Date,
    slot: SlotType
  ): Promise<{ available: number; total: number }> {
    // Get settings
    const settings = await this.getSettings();

    // Count CONFIRMED reservations only
    const confirmedCount = await this.prisma.reservation.count({
      where: {
        date: this.normalizeDate(date),
        slot,
        status: ReservationStatus.CONFIRMED,
      },
    });

    const available = Math.max(0, settings.totalDesks - confirmedCount);

    return {
      available,
      total: settings.totalDesks,
    };
  }

  /**
   * Create a new reservation
   * Validates capacity and prevents duplicate bookings
   */
  async createReservation(
    userId: string,
    date: Date,
    slot: SlotType
  ): Promise<Result<Reservation>> {
    const normalizedDate = this.normalizeDate(date);

    // Check if user already has a CONFIRMED booking for this date+slot
    const existingConfirmed = await this.prisma.reservation.findFirst({
      where: {
        userId,
        date: normalizedDate,
        slot,
        status: ReservationStatus.CONFIRMED,
      },
    });

    if (existingConfirmed) {
      return { success: false, error: ReservationError.DUPLICATE };
    }

    // Check capacity
    const availability = await this.checkAvailability(date, slot);
    if (availability.available <= 0) {
      return { success: false, error: ReservationError.FULL };
    }

    // Create reservation
    try {
      const reservation = await this.prisma.reservation.create({
        data: {
          userId,
          date: normalizedDate,
          slot,
          status: ReservationStatus.CONFIRMED,
        },
      });

      return { success: true, data: reservation };
    } catch (error) {
      // Handle unique constraint violation (race condition)
      if (this.isUniqueConstraintError(error)) {
        return { success: false, error: ReservationError.DUPLICATE };
      }
      throw error;
    }
  }

  /**
   * Cancel a reservation (soft delete)
   * Only allowed before slot start time
   */
  async cancelReservation(
    reservationId: string,
    userId: string
  ): Promise<Result<Reservation>> {
    // Find reservation
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      return { success: false, error: ReservationError.NOT_FOUND };
    }

    // Check ownership
    if (reservation.userId !== userId) {
      return { success: false, error: ReservationError.UNAUTHORIZED };
    }

    // Check if already cancelled
    if (reservation.status === ReservationStatus.CANCELLED) {
      return { success: false, error: ReservationError.NOT_FOUND };
    }

    // Check if slot has started
    const settings = await this.getSettings();
    const slotStartTime = this.getSlotStartTime(
      reservation.date,
      reservation.slot,
      settings
    );
    const now = new Date();

    if (now >= slotStartTime) {
      return { success: false, error: ReservationError.TOO_LATE };
    }

    // Cancel reservation (soft delete)
    const cancelled = await this.prisma.reservation.update({
      where: { id: reservationId },
      data: { status: ReservationStatus.CANCELLED },
    });

    return { success: true, data: cancelled };
  }

  /**
   * Get coworking settings (creates default if not exists)
   */
  private async getSettings(): Promise<CoworkingSettings> {
    let settings = await this.prisma.coworkingSettings.findFirst();

    if (!settings) {
      settings = await this.prisma.coworkingSettings.create({
        data: {
          totalDesks: 10,
          morningStartHour: 8,
          morningEndHour: 13,
          afternoonStartHour: 13,
          afternoonEndHour: 18,
        },
      });
    }

    return settings;
  }

  /**
   * Calculate slot start time based on settings
   */
  private getSlotStartTime(
    date: Date,
    slot: SlotType,
    settings: CoworkingSettings
  ): Date {
    const startTime = new Date(date);
    startTime.setHours(
      slot === SlotType.MORNING
        ? settings.morningStartHour
        : settings.afternoonStartHour,
      0,
      0,
      0
    );
    return startTime;
  }

  /**
   * Normalize date to midnight UTC for consistent querying
   */
  private normalizeDate(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }

  /**
   * Check if error is a unique constraint violation
   */
  private isUniqueConstraintError(error: any): boolean {
    return (
      error?.code === 'P2002' || // Prisma unique constraint error
      error?.message?.includes('Unique constraint')
    );
  }
}
