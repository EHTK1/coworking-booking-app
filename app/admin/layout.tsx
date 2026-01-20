// app/admin/layout.tsx - Admin layout with navigation

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { initAuth, logout, isAdmin } from '../../lib/client-auth';
import '../globals.css';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      const user = await initAuth();
      if (!user) {
        router.push('/login');
      } else if (!isAdmin()) {
        router.push('/reservations');
      } else {
        setMounted(true);
      }
    };
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout();
      router.push('/login');
    }
  };

  if (!mounted) {
    return null;
  }

  const navItems = [
    { path: '/admin', label: 'Dashboard' },
    { path: '/admin/reservations', label: 'Reservations' },
    { path: '/admin/users', label: 'Users' },
    { path: '/admin/settings', label: 'Settings' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav className="admin-nav">
        <div className="admin-nav-header">
          <h2>Admin Panel</h2>
        </div>
        <ul className="admin-nav-list">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                href={item.path}
                className={pathname === item.path ? 'active' : ''}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="admin-nav-footer">
          <Link href="/reservations" className="link">
            ← Member View
          </Link>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm">
            Logout
          </button>
        </div>
      </nav>
      <main className="admin-main">{children}</main>
    </div>
  );
}
