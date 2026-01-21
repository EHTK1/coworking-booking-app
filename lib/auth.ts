// lib/auth.ts - Authentication helpers

import { NextRequest } from 'next/server';
import { getUserFromSession } from './session';
import { Role } from '../types';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string | null;
  phone: string | null;
  role: Role;
}

export const SESSION_COOKIE_NAME = 'session_token';

/**
 * Get authenticated user from request
 * Verifies session token from cookie
 */
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const user = await getUserFromSession(sessionToken);
  return user;
}

/**
 * Check if user has admin role
 */
export function isAdmin(user: AuthUser): boolean {
  return user.role === Role.ADMIN;
}

/**
 * Require authenticated user or throw 401
 */
export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const user = await getAuthUser(request);

  if (!user) {
    throw new AuthError('Unauthorized', 401);
  }

  return user;
}

/**
 * Require admin role or throw 403
 */
export async function requireAdmin(request: NextRequest): Promise<AuthUser> {
  const user = await requireAuth(request);

  if (!isAdmin(user)) {
    throw new AuthError('Forbidden - Admin access required', 403);
  }

  return user;
}

export class AuthError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = 'AuthError';
  }
}
