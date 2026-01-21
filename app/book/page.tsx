// app/book/page.tsx - Booking page

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { initAuth } from '../../lib/client-auth';
import { createReservation } from '../../lib/api-client';
import { SlotType } from '../../types';

export default function BookPage() {
  const t = useTranslations('booking');
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
      setError(result.error || t('error'));
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
          {t('backToReservations')}
        </Link>
      </div>

      <div className="card" style={{ maxWidth: '500px', margin: '40px auto' }}>
        <h1>{t('title')}</h1>

        {success && (
          <div className="success">
            {t('success')}
          </div>
        )}

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="date">{t('date')}</label>
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
            <label>{t('timeSlot')}</label>
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
                <span>{t('morning')}</span>
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
                <span>{t('afternoon')}</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || success}
          >
            {loading ? t('booking') : t('bookButton')}
          </button>
        </form>
      </div>
    </div>
  );
}
