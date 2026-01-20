// app/login/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login } from '../../lib/client-auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await login(email, password);

    if (result.success) {
      router.push('/reservations');
    } else {
      const errorMsg = result.error || 'Login failed';
      // Add helpful message for invalid credentials
      if (errorMsg.includes('Invalid email or password')) {
        setError('Invalid email or password. Don\'t have an account? Click "Sign up" below to create one.');
      } else {
        setError(errorMsg);
      }
    }

    setLoading(false);
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '400px', margin: '100px auto' }}>
        <h1>Login</h1>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Sign in to your account
        </p>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
          Don't have an account?{' '}
          <Link href="/register" className="link">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
