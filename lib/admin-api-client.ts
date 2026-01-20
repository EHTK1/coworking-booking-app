// lib/admin-api-client.ts - Admin API client functions

'use client';

import { SlotType } from '../types';

export interface ApiError {
  error: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function fetchAdminApi<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Include cookies
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'An error occurred',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Network error',
    };
  }
}

export async function getAdminStats() {
  return fetchAdminApi('/api/admin/stats', {
    method: 'GET',
  });
}

export async function getAdminReservations(
  filters?: { date?: string; slot?: SlotType }
) {
  const params = new URLSearchParams();
  if (filters?.date) params.append('date', filters.date);
  if (filters?.slot) params.append('slot', filters.slot);

  const queryString = params.toString();
  const url = `/api/admin/reservations${queryString ? `?${queryString}` : ''}`;

  return fetchAdminApi(url, {
    method: 'GET',
  });
}

export async function getAdminUsers() {
  return fetchAdminApi('/api/admin/users', {
    method: 'GET',
  });
}

export async function getAdminSettings() {
  return fetchAdminApi('/api/admin/settings', {
    method: 'GET',
  });
}

export async function updateAdminSettings(settings: {
  totalDesks?: number;
  morningStartHour?: number;
  morningEndHour?: number;
  afternoonStartHour?: number;
  afternoonEndHour?: number;
}) {
  return fetchAdminApi('/api/admin/settings', {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });
}
