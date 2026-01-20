// app/admin/reservations/page.tsx - Admin Reservations List

'use client';

import { useEffect, useState } from 'react';
import { getAdminReservations } from '../../../lib/admin-api-client';
import { SlotType } from '../../../types';

interface Reservation {
  id: string;
  date: string;
  slot: SlotType;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState('');
  const [slotFilter, setSlotFilter] = useState<SlotType | ''>('');

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    setLoading(true);
    const filters: any = {};
    if (dateFilter) filters.date = dateFilter;
    if (slotFilter) filters.slot = slotFilter;

    const result = await getAdminReservations(filters);

    if (result.success) {
      setReservations(result.data || []);
      setError(null);
    } else {
      setError(result.error || 'Failed to load reservations');
    }
    setLoading(false);
  };

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    loadReservations();
  };

  const clearFilters = () => {
    setDateFilter('');
    setSlotFilter('');
    setTimeout(() => loadReservations(), 0);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatSlot = (slot: SlotType) => {
    return slot === SlotType.MORNING ? 'Morning' : 'Afternoon';
  };

  return (
    <div>
      <h1 style={{ marginBottom: '30px' }}>All Reservations</h1>

      <form onSubmit={handleFilter} className="admin-filters">
        <div className="form-group">
          <label htmlFor="date">Date</label>
          <input
            type="date"
            id="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="slot">Slot</label>
          <select
            id="slot"
            value={slotFilter}
            onChange={(e) => setSlotFilter(e.target.value as SlotType | '')}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px',
            }}
          >
            <option value="">All Slots</option>
            <option value={SlotType.MORNING}>Morning</option>
            <option value={SlotType.AFTERNOON}>Afternoon</option>
          </select>
        </div>

        <button type="submit" className="btn btn-primary">
          Filter
        </button>
        <button
          type="button"
          onClick={clearFilters}
          className="btn btn-secondary"
        >
          Clear
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <p>Loading reservations...</p>
      ) : reservations.length === 0 ? (
        <div className="empty-state">
          <p>No reservations found</p>
        </div>
      ) : (
        <div className="admin-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Slot</th>
                <th>User</th>
                <th>Email</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((reservation) => (
                <tr key={reservation.id}>
                  <td>{formatDate(reservation.date)}</td>
                  <td>{formatSlot(reservation.slot)}</td>
                  <td>{reservation.user.name}</td>
                  <td>{reservation.user.email}</td>
                  <td>
                    <span className="badge">{reservation.status}</span>
                  </td>
                  <td>{formatDate(reservation.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ marginTop: '20px', color: '#666', fontSize: '14px' }}>
        Showing {reservations.length} confirmed reservation(s)
      </p>
    </div>
  );
}
