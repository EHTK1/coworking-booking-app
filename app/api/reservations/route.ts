// app/api/reservations/route.ts

import { NextRequest } from 'next/server';
import { ReservationService } from '../../../ReservationService';
import { prisma } from '../../../lib/prisma';
import { requireAuth } from '../../../lib/auth';
import {
  handleError,
  successResponse,
  reservationErrorResponse,
} from '../../../lib/api-utils';
import { SlotType } from '../../../types';
import { emailService } from '../../../lib/email';

const reservationService = new ReservationService(prisma);

/**
 * POST /api/reservations
 * Create a new reservation
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    const { date, slot } = body;

    // Validate input
    if (!date || !slot) {
      return successResponse(
        { error: 'Missing required fields: date, slot' },
        400
      );
    }

    if (!Object.values(SlotType).includes(slot)) {
      return successResponse(
        { error: 'Invalid slot type. Must be MORNING or AFTERNOON' },
        400
      );
    }

    // Parse date string as local date (YYYY-MM-DD)
    // Avoid timezone issues by parsing manually
    const [year, month, day] = date.split('-').map(Number);
    const bookingDate = new Date(year, month - 1, day);

    // Call service
    const result = await reservationService.createReservation(
      user.id,
      bookingDate,
      slot as SlotType
    );

    if (!result.success) {
      return reservationErrorResponse(result.error);
    }

    // Send confirmation email asynchronously (non-blocking)
    // Email failure does NOT affect reservation success
    emailService.sendReservationConfirmation({
      to: user.email,
      name: user.name,
      date: result.data.date,
      slot: result.data.slot,
      reservationId: result.data.id,
    }).catch(() => {
      // Errors are already logged by emailService
      // Silently continue - email is optional
    });

    return successResponse(result.data, 201);
  } catch (error) {
    return handleError(error);
  }
}
