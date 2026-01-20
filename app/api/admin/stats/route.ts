// app/api/admin/stats/route.ts

import { NextRequest } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAdmin } from '../../../../lib/auth';
import { handleError, successResponse } from '../../../../lib/api-utils';
import { ReservationStatus } from '../../../../types';

/**
 * GET /api/admin/stats
 * Get system statistics (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const [totalUsers, totalReservations, confirmedReservations, settings] =
      await Promise.all([
        prisma.user.count(),
        prisma.reservation.count(),
        prisma.reservation.count({
          where: { status: ReservationStatus.CONFIRMED },
        }),
        prisma.coworkingSettings.findFirst(),
      ]);

    const stats = {
      totalUsers,
      totalReservations,
      confirmedReservations,
      cancelledReservations: totalReservations - confirmedReservations,
      totalDesks: settings?.totalDesks ?? 0,
    };

    return successResponse(stats);
  } catch (error) {
    return handleError(error);
  }
}
