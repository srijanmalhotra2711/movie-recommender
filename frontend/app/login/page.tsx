'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await authAPI.login(username, password);
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      const userResponse = await authAPI.getMe();
      login(access_token, userResponse.data);
      router.push('/browse');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(to bottom right, #000000, #1a0505, #000000)',
    padding: '20px',
  };

  const logoBoxStyle = {
    display: 'inline-block',
    padding: '20px',
    background: 'linear-gradient(to bottom right, #dc2626, #991b1b)',
    borderRadius: '16px',
    marginBottom: '20px',
    boxShadow: '0 20px 40px rgba(220, 38, 38, 0.4)',
  };

  const cardStyle = {
    background: 'rgba(24, 24, 27, 0.95)',
    padding: '40px',
    borderRadius: '20px',
    border: '1px solid rgba(63, 63, 70, 0.5)',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.7)',
    maxWidth: '450px',
    width: '100%',
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    background: '#27272a',
    border: '2px solid #3f3f46',
    borderRadius: '10px',
    color: 'white',
    fontSize: '16px',
    outline: 'none',
  };

  const buttonStyle = {
    width: '100%',
    padding: '16px',
    background: 'linear-gradient(to right, #dc2626, #991b1b)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '18px',
    fontWeight: '600',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.6 : 1,
    boxShadow: '0 10px 25px rgba(220, 38, 38, 0.5)',
  };

  return (
    <div style={containerStyle}>
      <div style={{ textAlign: 'center', maxWidth: '450px', width: '100%' }}>
        <div style={{ marginBottom: '40px' }}>
          <div style={logoBoxStyle}>
            <div style={{ width: '48px', height: '48px', border: '3px solid white', borderRadius: '8px' }}></div>
          </div>
          <h1 style={{ fontSize: '56px', fontWeight: '900', color: 'white', margin: '0 0 10px 0' }}>
            CineMatch
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '18px', margin: 0 }}>
            Your AI Movie Companion
          </p>
        </div>

        <div style={cardStyle}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', marginBottom: '30px', marginTop: 0 }}>
            Welcome Back
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#d1d5db', marginBottom: '8px', fontWeight: '500' }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                style={inputStyle}
                required
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#d1d5db', marginBottom: '8px', fontWeight: '500' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                style={inputStyle}
                required
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(220, 38, 38, 0.15)',
                border: '2px solid #dc2626',
                color: '#fca5a5',
                padding: '14px',
                borderRadius: '10px',
                marginBottom: '20px',
                fontSize: '14px',
              }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={buttonStyle}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '30px', paddingTop: '30px', borderTop: '1px solid #3f3f46' }}>
            <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '14px', marginBottom: '15px' }}>
              Demo Account
            </p>
            <div style={{ background: '#27272a', padding: '18px', borderRadius: '10px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'monospace', fontSize: '18px', color: 'white', margin: 0 }}>
                <span style={{ color: '#dc2626', fontWeight: 'bold' }}>user1</span>
                <span style={{ color: '#6b7280' }}> / </span>
                <span style={{ color: '#dc2626', fontWeight: 'bold' }}>password123</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}