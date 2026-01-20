// app/book/page.tsx - Booking page

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { initAuth } from '../../lib/client-auth';
import { createReservation } from '../../lib/api-client';
import { SlotType } from '../../types';

export default function BookPage() {
  const [mounted, setMounted] = useState(false);
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState<SlotType>(SlotType.MORNING);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const user = await initAuth();
      if (!user) {
        router.push('/login');
      } else {
        setMounted(true);
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        setDate(today);
      }
    };
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await createReservation(date, slot);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push('/reservations');
      }, 2000);
    } else {
      setError(result.error || 'Failed to create reservation');
    }

    setLoading(false);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="container">
      <div className="header">
        <Link href="/reservations" className="link">
          ← Back to reservations
        </Link>
      </div>

      <div className="card" style={{ maxWidth: '500px', margin: '40px auto' }}>
        <h1>Book a Desk</h1>

        {success && (
          <div className="success">
            Reservation created successfully! Redirecting...
          </div>
        )}

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="date">Date</label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Time Slot</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="slot"
                  value={SlotType.MORNING}
                  checked={slot === SlotType.MORNING}
                  onChange={(e) => setSlot(e.target.value as SlotType)}
                  disabled={loading}
                />
                <span>Morning (08:00 - 13:00)</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="slot"
                  value={SlotType.AFTERNOON}
                  checked={slot === SlotType.AFTERNOON}
                  onChange={(e) => setSlot(e.target.value as SlotType)}
                  disabled={loading}
                />
                <span>Afternoon (13:00 - 18:00)</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || success}
          >
            {loading ? 'Booking...' : 'Book Desk'}
          </button>
        </form>
      </div>
    </div>
  );
}
