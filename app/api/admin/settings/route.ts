// app/api/admin/settings/route.ts

import { NextRequest } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAdmin } from '../../../../lib/auth';
import { handleError, successResponse } from '../../../../lib/api-utils';

/**
 * GET /api/admin/settings
 * Get coworking settings (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    let settings = await prisma.coworkingSettings.findFirst();

    if (!settings) {
      settings = await prisma.coworkingSettings.create({
        data: {
          totalDesks: 10,
          morningStartHour: 8,
          morningEndHour: 13,
          afternoonStartHour: 13,
          afternoonEndHour: 18,
        },
      });
    }

    return successResponse(settings);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PATCH /api/admin/settings
 * Update coworking settings (admin only)
 */
export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin(request);
    const body = await request.json();

    const {
      totalDesks,
      morningStartHour,
      morningEndHour,
      afternoonStartHour,
      afternoonEndHour,
    } = body;

    // Get existing settings
    let settings = await prisma.coworkingSettings.findFirst();

    if (!settings) {
      // Create if doesn't exist
      settings = await prisma.coworkingSettings.create({
        data: {
          totalDesks: totalDesks ?? 10,
          morningStartHour: morningStartHour ?? 8,
          morningEndHour: morningEndHour ?? 13,
          afternoonStartHour: afternoonStartHour ?? 13,
          afternoonEndHour: afternoonEndHour ?? 18,
        },
      });
    } else {
      // Update existing
      settings = await prisma.coworkingSettings.update({
        where: { id: settings.id },
        data: {
          ...(totalDesks !== undefined && { totalDesks }),
          ...(morningStartHour !== undefined && { morningStartHour }),
          ...(morningEndHour !== undefined && { morningEndHour }),
          ...(afternoonStartHour !== undefined && { afternoonStartHour }),
          ...(afternoonEndHour !== undefined && { afternoonEndHour }),
        },
      });
    }

    return successResponse(settings);
  } catch (error) {
    return handleError(error);
  }
}
