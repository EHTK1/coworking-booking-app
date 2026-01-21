// lib/server-i18n.ts - Server-side i18n utilities

import { ReservationError } from '../types';

/**
 * Get translated error message for ReservationError
 * Returns French translation by default (server-side)
 */
export function getReservationErrorMessage(error: ReservationError): string {
  const messages: Record<ReservationError, string> = {
    [ReservationError.FULL]: 'Plus de bureaux disponibles pour ce créneau',
    [ReservationError.DUPLICATE]: 'Vous avez déjà une réservation pour ce créneau',
    [ReservationError.NOT_FOUND]: 'Réservation non trouvée',
    [ReservationError.NOT_OWNER]: 'Vous ne pouvez pas modifier cette réservation',
    [ReservationError.TOO_LATE]: 'Trop tard pour annuler cette réservation',
    [ReservationError.ALREADY_CANCELLED]: 'Cette réservation a déjà été annulée',
  };

  return messages[error] || 'Une erreur s\'est produite';
}
