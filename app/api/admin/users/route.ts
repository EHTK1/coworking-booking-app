// app/api/admin/users/route.ts

import { NextRequest } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { requireAdmin } from '../../../../lib/auth';
import { handleError, successResponse } from '../../../../lib/api-utils';

/**
 * GET /api/admin/users
 * Get all users (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        company: true,
        phone: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            reservations: true,
          },
        },
      },
    });

    return successResponse(users);
  } catch (error) {
    return handleError(error);
  }
}
