// lib/api-utils.ts - API utilities and error mapping

import { NextResponse } from 'next/server';
import { ReservationError } from '../types';
import { AuthError } from './auth';
import { logger } from './logger';
import { monitoring } from './monitoring';

/**
 * Map ReservationError to HTTP status code
 */
export function getErrorStatusCode(error: ReservationError): number {
  switch (error) {
    case ReservationError.FULL:
      return 409; // Conflict
    case ReservationError.DUPLICATE:
      return 409; // Conflict
    case ReservationError.TOO_LATE:
      return 400; // Bad Request
    case ReservationError.NOT_FOUND:
      return 404; // Not Found
    case ReservationError.UNAUTHORIZED:
      return 403; // Forbidden
    default:
      return 500;
  }
}

/**
 * Map ReservationError to user-friendly message
 */
export function getErrorMessage(error: ReservationError): string {
  switch (error) {
    case ReservationError.FULL:
      return 'No desks available for this time slot';
    case ReservationError.DUPLICATE:
      return 'You already have a booking for this time slot';
    case ReservationError.TOO_LATE:
      return 'Cannot cancel - time slot has already started';
    case ReservationError.NOT_FOUND:
      return 'Reservation not found';
    case ReservationError.UNAUTHORIZED:
      return 'You are not authorized to perform this action';
    default:
      return 'An error occurred';
  }
}

/**
 * Handle errors and return appropriate response
 */
export function handleError(
  error: unknown,
  context?: {
    route?: string;
    method?: string;
    userId?: string;
  }
): NextResponse {
  // Log error with structured logging
  logger.error('API error occurred', {
    route: context?.route,
    method: context?.method,
    userId: context?.userId,
  }, error instanceof Error ? error : new Error(String(error)));

  // Send to monitoring service
  if (error instanceof Error) {
    monitoring.captureException(error, {
      request: context?.method && context?.route ? {
        method: context.method,
        url: context.route,
      } : undefined,
      user: context?.userId ? { id: context.userId } : undefined,
    });
  }

  if (error instanceof AuthError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    // Don't expose internal error details in production
    const message = process.env.NODE_ENV === 'production'
      ? 'An internal error occurred'
      : error.message;

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}

/**
 * Create success response
 */
export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Create error response from ReservationError
 */
export function reservationErrorResponse(error: ReservationError): NextResponse {
  return NextResponse.json(
    { error: getErrorMessage(error) },
    { status: getErrorStatusCode(error) }
  );
}

/**
 * Log incoming API request
 */
export function logApiRequest(
  method: string,
  route: string,
  userId?: string,
  additionalContext?: Record<string, unknown>
): void {
  logger.info('API request', {
    method,
    route,
    userId,
    ...additionalContext,
  });
}

/**
 * Log API response
 */
export function logApiResponse(
  method: string,
  route: string,
  statusCode: number,
  userId?: string,
  durationMs?: number
): void {
  const level = statusCode >= 400 ? 'warn' : 'info';
  logger[level]('API response', {
    method,
    route,
    statusCode,
    userId,
    durationMs,
  });
}
