// app/api/reservations/[id]/cancel/route.ts

import { NextRequest } from 'next/server';
import { ReservationService } from '../../../../../ReservationService';
import { prisma } from '../../../../../lib/prisma';
import { requireAuth } from '../../../../../lib/auth';
import {
  handleError,
  successResponse,
  reservationErrorResponse,
} from '../../../../../lib/api-utils';
import { emailService } from '../../../../../lib/email';

const reservationService = new ReservationService(prisma);

/**
 * POST /api/reservations/:id/cancel
 * Cancel a reservation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id: reservationId } = await params;

    // Call service
    const result = await reservationService.cancelReservation(
      reservationId,
      user.id
    );

    if (!result.success) {
      return reservationErrorResponse(result.error);
    }

    // Send cancellation email asynchronously (non-blocking)
    // Email failure does NOT affect cancellation success
    emailService.sendReservationCancellation({
      to: user.email,
      name: user.name,
      date: result.data.date,
      slot: result.data.slot,
      reservationId: result.data.id,
    }).catch(() => {
      // Errors are already logged by emailService
      // Silently continue - email is optional
    });

    return successResponse(result.data);
  } catch (error) {
    return handleError(error);
  }
}
