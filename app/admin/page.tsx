// app/admin/page.tsx - Admin Dashboard

'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { getAdminStats } from '../../lib/admin-api-client';

interface Stats {
  totalUsers: number;
  totalReservations: number;
  confirmedReservations: number;
  cancelledReservations: number;
  totalDesks: number;
}

export default function AdminDashboard() {
  const t = useTranslations('admin.dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const result = await getAdminStats();

    if (result.success) {
      setStats(result.data as Stats);
      setError(null);
    } else {
      setError(result.error || 'Failed to load stats');
    }
    setLoading(false);
  };

  if (loading) {
    return <div>{t('loading')}</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!stats) {
    return <div>{t('noData')}</div>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '30px' }}>{t('title')}</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">{t('stats.totalUsers')}</div>
          <div className="stat-value">{stats.totalUsers}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">{t('stats.totalDesks')}</div>
          <div className="stat-value">{stats.totalDesks}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">{t('stats.confirmedReservations')}</div>
          <div className="stat-value">{stats.confirmedReservations}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">{t('stats.cancelledReservations')}</div>
          <div className="stat-value">{stats.cancelledReservations}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">{t('stats.totalReservations')}</div>
          <div className="stat-value">{stats.totalReservations}</div>
        </div>
      </div>

      <div style={{ marginTop: '40px' }}>
        <h2 style={{ marginBottom: '20px' }}>{t('quickActions')}</h2>
        <div style={{ display: 'flex', gap: '16px' }}>
          <a href="/admin/reservations" className="btn btn-primary">
            {t('viewAllReservations')}
          </a>
          <a href="/admin/users" className="btn btn-secondary">
            {t('manageUsers')}
          </a>
          <a href="/admin/settings" className="btn btn-secondary">
            {t('updateSettings')}
          </a>
        </div>
      </div>
    </div>
  );
}
