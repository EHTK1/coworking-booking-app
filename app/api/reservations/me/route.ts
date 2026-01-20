// app/api/reservations/me/route.ts

import { NextRequest } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAuth } from '../../../../lib/auth';
import { handleError, successResponse } from '../../../../lib/api-utils';
import { ReservationStatus } from '../../../../types';

/**
 * GET /api/reservations/me
 * Get current user's reservations (only CONFIRMED)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // Fetch user's CONFIRMED reservations, sorted by date
    const reservations = await prisma.reservation.findMany({
      where: {
        userId: user.id,
        status: ReservationStatus.CONFIRMED,
      },
      orderBy: [{ date: 'asc' }, { slot: 'asc' }],
      select: {
        id: true,
        date: true,
        slot: true,
        status: true,
        createdAt: true,
      },
    });

    return successResponse(reservations);
  } catch (error) {
    return handleError(error);
  }
}
