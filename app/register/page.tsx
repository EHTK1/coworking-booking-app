// app/register/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register } from '../../lib/client-auth';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await register(email, password, name);

    if (result.success) {
      router.push('/reservations');
    } else {
      setError(result.error || 'Registration failed');
    }

    setLoading(false);
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '400px', margin: '100px auto' }}>
        <h1>Sign Up</h1>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Create a new account
        </p>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              disabled={loading}
            />
          </div>

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
              placeholder="At least 8 characters"
              required
              minLength={8}
              disabled={loading}
            />
            <small style={{ color: '#666', fontSize: '14px' }}>
              Minimum 8 characters
            </small>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
          Already have an account?{' '}
          <Link href="/login" className="link">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
