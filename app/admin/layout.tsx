// app/admin/layout.tsx - Admin layout with navigation

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { initAuth, logout, isAdmin } from '../../lib/client-auth';
import '../globals.css';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('admin');
  const tAuth = useTranslations('auth');
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
    if (confirm(tAuth('confirmLogout'))) {
      await logout();
      router.push('/login');
    }
  };

  if (!mounted) {
    return null;
  }

  const navItems = [
    { path: '/admin', label: t('navigation.dashboard') },
    { path: '/admin/reservations', label: t('navigation.reservations') },
    { path: '/admin/users', label: t('navigation.users') },
    { path: '/admin/settings', label: t('navigation.settings') },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <nav className="admin-nav">
        <div className="admin-nav-header">
          <h2>{t('panel')}</h2>
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
            {t('memberView')}
          </Link>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm">
            {tAuth('logout')}
          </button>
        </div>
      </nav>
      <main className="admin-main">{children}</main>
    </div>
  );
}
