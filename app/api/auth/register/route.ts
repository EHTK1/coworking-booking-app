// app/api/auth/register/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { hashPassword } from '../../../../lib/password';
import { createSession } from '../../../../lib/session';
import { SESSION_COOKIE_NAME } from '../../../../lib/auth';
import { handleError, successResponse } from '../../../../lib/api-utils';
import { Role } from '../../../../types';
import { rateLimit, getClientIdentifier, RATE_LIMITS } from '../../../../lib/rate-limit';

/**
 * POST /api/auth/register
 * Register a new user
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimitResult = rateLimit(`register:${identifier}`, RATE_LIMITS.AUTH);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)),
          },
        }
      );
    }

    const body = await request.json();
    const { email, password, name } = body;

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, name' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: Role.MEMBER, // Default role
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    // Create session
    const sessionToken = await createSession(user.id);

    // Set session cookie
    const response = successResponse(user, 201);
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    return handleError(error);
  }
}
