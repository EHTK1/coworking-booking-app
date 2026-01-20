// lib/api-client.ts - Client-side API wrapper

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

async function fetchApi<T>(
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

export async function getMyReservations() {
  return fetchApi('/api/reservations/me', {
    method: 'GET',
  });
}

export async function createReservation(date: string, slot: SlotType) {
  return fetchApi('/api/reservations', {
    method: 'POST',
    body: JSON.stringify({ date, slot }),
  });
}

export async function cancelReservation(reservationId: string) {
  return fetchApi(`/api/reservations/${reservationId}/cancel`, {
    method: 'POST',
  });
}
