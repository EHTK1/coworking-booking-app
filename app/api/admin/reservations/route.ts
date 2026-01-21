// app/api/admin/reservations/route.ts

import { NextRequest } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAdmin } from '../../../../lib/auth';
import { handleError, successResponse } from '../../../../lib/api-utils';
import { SlotType, ReservationStatus } from '../../../../types';

/**
 * GET /api/admin/reservations?date=YYYY-MM-DD&slot=MORNING
 * Get all reservations for a specific date/slot (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const slotParam = searchParams.get('slot');

    // Build filter
    const where: any = {
      status: ReservationStatus.CONFIRMED,
    };

    if (dateParam) {
      where.date = new Date(dateParam);
    }

    if (slotParam && Object.values(SlotType).includes(slotParam as SlotType)) {
      where.slot = slotParam as SlotType;
    }

    // Fetch reservations with user details
    const reservations = await prisma.reservation.findMany({
      where,
      orderBy: [{ date: 'asc' }, { slot: 'asc' }],
      select: {
        id: true,
        date: true,
        slot: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return successResponse(reservations);
  } catch (error) {
    return handleError(error);
  }
}
