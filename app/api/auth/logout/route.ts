// app/api/auth/logout/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { deleteSession } from '../../../../lib/session';
import { SESSION_COOKIE_NAME } from '../../../../lib/auth';
import { handleError, successResponse } from '../../../../lib/api-utils';

/**
 * POST /api/auth/logout
 * Logout current session
 */
export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (sessionToken) {
      await deleteSession(sessionToken);
    }

    // Clear cookie
    const response = successResponse({ message: 'Logged out successfully' });
    response.cookies.delete(SESSION_COOKIE_NAME);

    return response;
  } catch (error) {
    return handleError(error);
  }
}
