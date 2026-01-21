// lib/client-auth.ts - Client-side auth utilities

'use client';

import { Role } from '../types';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string | null;
  phone: string | null;
  role: Role;
}

let currentUser: User | null = null;
let isInitialized = false;

/**
 * Initialize auth by fetching current user
 */
export async function initAuth(): Promise<User | null> {
  if (isInitialized) {
    return currentUser;
  }

  try {
    const response = await fetch('/api/auth/me', {
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      currentUser = data.user;
    } else {
      currentUser = null;
    }
  } catch (error) {
    currentUser = null;
  }

  isInitialized = true;
  return currentUser;
}

/**
 * Get current user (must call initAuth first)
 */
export function getCurrentUser(): User | null {
  return currentUser;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return currentUser !== null;
}

/**
 * Check if user is admin
 */
export function isAdmin(): boolean {
  return currentUser?.role === Role.ADMIN;
}

/**
 * Login with email and password
 */
export async function login(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      currentUser = data;
      return { success: true, user: data };
    } else {
      return { success: false, error: data.error || 'Login failed' };
    }
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

/**
 * Register a new user
 */
export async function register(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  company?: string,
  phone?: string
): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, firstName, lastName, company, phone }),
    });

    const data = await response.json();

    if (response.ok) {
      currentUser = data;
      return { success: true, user: data };
    } else {
      return { success: false, error: data.error || 'Registration failed' };
    }
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

/**
 * Logout current user
 */
export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    // Ignore errors
  }

  currentUser = null;
  isInitialized = false;
}

/**
 * Clear local auth state (for compatibility)
 */
export function clearUserId() {
  currentUser = null;
  isInitialized = false;
}
