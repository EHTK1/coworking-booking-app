// app/admin/settings/page.tsx - Admin Settings

'use client';

import { useEffect, useState } from 'react';
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
      setError(result.error || 'Failed to load settings');
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
      setError(result.error || 'Failed to update settings');
    }
    setSaving(false);
  };

  if (loading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div>
      <h1 style={{ marginBottom: '30px' }}>System Settings</h1>

      {success && (
        <div className="success">Settings updated successfully!</div>
      )}

      {error && <div className="error">{error}</div>}

      <div
        className="card"
        style={{ maxWidth: '600px', background: 'white', padding: '30px' }}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="totalDesks">Total Desks</label>
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
              Maximum number of desks available for booking
            </small>
          </div>

          <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid #eee' }} />

          <h3 style={{ marginBottom: '20px' }}>Morning Slot Hours</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="morningStartHour">Start Hour</label>
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
              <label htmlFor="morningEndHour">End Hour</label>
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

          <h3 style={{ marginBottom: '20px' }}>Afternoon Slot Hours</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="afternoonStartHour">Start Hour</label>
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
              <label htmlFor="afternoonEndHour">End Hour</label>
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
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>

        {settings && (
          <p style={{ marginTop: '30px', color: '#666', fontSize: '14px' }}>
            Last updated: {new Date(settings.updatedAt).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
