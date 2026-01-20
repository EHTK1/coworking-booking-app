// app/api/auth/me/route.ts

import { NextRequest } from 'next/server';
import { getAuthUser } from '../../../../lib/auth';
import { handleError, successResponse } from '../../../../lib/api-utils';

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user) {
      return successResponse({ user: null }, 200);
    }

    return successResponse({ user });
  } catch (error) {
    return handleError(error);
  }
}
