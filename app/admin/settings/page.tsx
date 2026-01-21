// app/admin/settings/page.tsx - Admin Settings

'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  getAdminSettings,
  updateAdminSettings,
} from '../../../lib/admin-api-client';

interface Settings {
  id: string;
  totalDesks: number;
  morningStartHour: number;
  morningEndHour: number;
  afternoonStartHour: number;
  afternoonEndHour: number;
  updatedAt: string;
}

export default function AdminSettingsPage() {
  const t = useTranslations('admin.settings');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form fields
  const [totalDesks, setTotalDesks] = useState(10);
  const [morningStartHour, setMorningStartHour] = useState(8);
  const [morningEndHour, setMorningEndHour] = useState(13);
  const [afternoonStartHour, setAfternoonStartHour] = useState(13);
  const [afternoonEndHour, setAfternoonEndHour] = useState(18);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const result = await getAdminSettings();

    if (result.success) {
      const data = result.data as Settings;
      setSettings(data);
      setTotalDesks(data.totalDesks);
      setMorningStartHour(data.morningStartHour);
      setMorningEndHour(data.morningEndHour);
      setAfternoonStartHour(data.afternoonStartHour);
      setAfternoonEndHour(data.afternoonEndHour);
      setError(null);
    } else {
      setError(result.error || t('error'));
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const result = await updateAdminSettings({
      totalDesks,
      morningStartHour,
      morningEndHour,
      afternoonStartHour,
      afternoonEndHour,
    });

    if (result.success) {
      setSuccess(true);
      await loadSettings();
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || t('error'));
    }
    setSaving(false);
  };

  if (loading) {
    return <div>{t('loading')}</div>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '30px' }}>{t('title')}</h1>

      {success && (
        <div className="success">{t('success')}</div>
      )}

      {error && <div className="error">{error}</div>}

      <div
        className="card"
        style={{ maxWidth: '600px', background: 'white', padding: '30px' }}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="totalDesks">{t('totalDesks')}</label>
            <input
              type="number"
              id="totalDesks"
              value={totalDesks}
              onChange={(e) => setTotalDesks(Number(e.target.value))}
              min={1}
              max={1000}
              required
              disabled={saving}
            />
            <small style={{ color: '#666', fontSize: '14px' }}>
              {t('totalDesksDescription')}
            </small>
          </div>

          <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid #eee' }} />

          <h3 style={{ marginBottom: '20px' }}>{t('morningSlot')}</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="morningStartHour">{t('startTime')}</label>
              <input
                type="number"
                id="morningStartHour"
                value={morningStartHour}
                onChange={(e) => setMorningStartHour(Number(e.target.value))}
                min={0}
                max={23}
                required
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label htmlFor="morningEndHour">{t('endTime')}</label>
              <input
                type="number"
                id="morningEndHour"
                value={morningEndHour}
                onChange={(e) => setMorningEndHour(Number(e.target.value))}
                min={0}
                max={23}
                required
                disabled={saving}
              />
            </div>
          </div>

          <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid #eee' }} />

          <h3 style={{ marginBottom: '20px' }}>{t('afternoonSlot')}</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="afternoonStartHour">{t('startTime')}</label>
              <input
                type="number"
                id="afternoonStartHour"
                value={afternoonStartHour}
                onChange={(e) => setAfternoonStartHour(Number(e.target.value))}
                min={0}
                max={23}
                required
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label htmlFor="afternoonEndHour">{t('endTime')}</label>
              <input
                type="number"
                id="afternoonEndHour"
                value={afternoonEndHour}
                onChange={(e) => setAfternoonEndHour(Number(e.target.value))}
                min={0}
                max={23}
                required
                disabled={saving}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{ marginTop: '20px' }}
          >
            {saving ? t('saving') : t('saveButton')}
          </button>
        </form>

        {settings && (
          <p style={{ marginTop: '30px', color: '#666', fontSize: '14px' }}>
            Last updated: {new Date(settings.updatedAt).toLocaleString('fr-FR')}
          </p>
        )}
      </div>
    </div>
  );
}
