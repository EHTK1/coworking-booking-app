// app/admin/users/page.tsx - Admin Users List

'use client';

import { useEffect, useState } from 'react';
import { getAdminUsers } from '../../../lib/admin-api-client';
import { Role } from '../../../types';

interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
  _count: {
    reservations: number;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const result = await getAdminUsers();

    if (result.success) {
      setUsers(result.data || []);
      setError(null);
    } else {
      setError(result.error || 'Failed to load users');
    }
    setLoading(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div>
      <h1 style={{ marginBottom: '30px' }}>Users</h1>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <p>Loading users...</p>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <p>No users found</p>
        </div>
      ) : (
        <div className="admin-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Total Reservations</th>
                <th>Member Since</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background:
                          user.role === Role.ADMIN ? '#667eea' : '#28a745',
                      }}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td>{user._count.reservations}</td>
                  <td>{formatDate(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ marginTop: '20px', color: '#666', fontSize: '14px' }}>
        Total users: {users.length}
      </p>
    </div>
  );
}
