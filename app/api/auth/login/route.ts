// app/api/auth/login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { verifyPassword } from '../../../../lib/password';
import { createSession } from '../../../../lib/session';
import { SESSION_COOKIE_NAME } from '../../../../lib/auth';
import { handleError, successResponse, logApiRequest, logApiResponse } from '../../../../lib/api-utils';
import { rateLimit, getClientIdentifier, RATE_LIMITS } from '../../../../lib/rate-limit';
import { logger } from '../../../../lib/logger';

/**
 * POST /api/auth/login
 * Login with email and password
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    logApiRequest('POST', '/api/auth/login');

    // Rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimitResult = rateLimit(`login:${identifier}`, RATE_LIMITS.AUTH);

    if (!rateLimitResult.success) {
      logger.warn('Rate limit exceeded for login', { identifier });
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)),
          },
        }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      logger.warn('Failed login attempt', { email });
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create session
    const sessionToken = await createSession(user.id);

    // Return user data (without password)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    // Set session cookie
    const response = successResponse(userData);
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    logger.info('User logged in successfully', { userId: user.id });
    logApiResponse('POST', '/api/auth/login', 200, user.id, Date.now() - startTime);

    return response;
  } catch (error) {
    logApiResponse('POST', '/api/auth/login', 500, undefined, Date.now() - startTime);
    return handleError(error, {
      route: '/api/auth/login',
      method: 'POST',
    });
  }
}
