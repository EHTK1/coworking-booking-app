// app/api/admin/middleware.ts - Admin rate limiting middleware

import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, getClientIdentifier, RATE_LIMITS } from '../../../lib/rate-limit';

export function applyAdminRateLimit(request: NextRequest): NextResponse | null {
  const identifier = getClientIdentifier(request);
  const rateLimitResult = rateLimit(`admin:${identifier}`, RATE_LIMITS.ADMIN);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
        },
      }
    );
  }

  return null; // No rate limit hit
}
