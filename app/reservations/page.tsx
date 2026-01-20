// app/reservations/page.tsx - My Reservations page

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { initAuth, logout } from '../../lib/client-auth';
import { getMyReservations, cancelReservation } from '../../lib/api-client';
import { SlotType } from '../../types';

interface Reservation {
  id: string;
  date: string;
  slot: SlotType;
  status: string;
  createdAt: string;
}

export default function ReservationsPage() {
  const [mounted, setMounted] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const user = await initAuth();
      if (!user) {
        router.push('/login');
      } else {
        setMounted(true);
        loadReservations();
      }
    };
    checkAuth();
  }, [router]);

  const loadReservations = async () => {
    setLoading(true);
    const result = await getMyReservations();

    if (result.success) {
      setReservations(result.data || []);
      setError(null);
    } else {
      setError(result.error || 'Failed to load reservations');
    }
    setLoading(false);
  };

  const handleCancel = async (reservationId: string) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    setCancellingId(reservationId);
    const result = await cancelReservation(reservationId);

    if (result.success) {
      // Reload reservations
      await loadReservations();
    } else {
      alert(result.error || 'Failed to cancel reservation');
    }
    setCancellingId(null);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatSlot = (slot: SlotType) => {
    return slot === SlotType.MORNING
      ? 'Morning (08:00-13:00)'
      : 'Afternoon (13:00-18:00)';
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout();
      router.push('/login');
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="container">
      <div className="header">
        <h1>My Reservations</h1>
        <button onClick={handleLogout} className="btn btn-secondary">
          Logout
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <p>Loading reservations...</p>
      ) : reservations.length === 0 ? (
        <div className="empty-state">
          <h2>No reservations yet</h2>
          <p>Start by booking your first desk for a half-day session.</p>
          <Link href="/book" className="btn btn-primary btn-lg">
            Book a Desk
          </Link>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '20px', textAlign: 'right' }}>
            <Link href="/book" className="btn btn-primary">
              + New Reservation
            </Link>
          </div>
          <div className="reservations-grid">
            {reservations.map((reservation) => (
              <div key={reservation.id} className="reservation-card-full">
                <div className="reservation-header">
                  <h3>{formatDate(reservation.date)}</h3>
                  <span className="badge">{reservation.status}</span>
                </div>
                <p className="reservation-slot-full">
                  {formatSlot(reservation.slot)}
                </p>
                <div className="reservation-actions">
                  <button
                    onClick={() => handleCancel(reservation.id)}
                    className="btn btn-danger btn-sm"
                    disabled={cancellingId === reservation.id}
                  >
                    {cancellingId === reservation.id ? 'Cancelling...' : 'Cancel'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
