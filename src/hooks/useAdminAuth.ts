import { useState, useEffect, useCallback } from 'react';

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // Initialize token from localStorage on mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('watch_lib_admin_token');
      if (stored) {
        setToken(stored);
      }
    }
  }, []);

  // Verify stored token against backend
  const verifyToken = useCallback(async () => {
    if (!token) {
      setIsAdmin(false);
      return;
    }
    try {
      const res = await fetch('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.isAdmin) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('watch_lib_admin_token');
        }
        setToken(null);
      }
    } catch {
      setIsAdmin(false);
    }
  }, [token]);

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  // Auth: Login
  const handleLogin = async (password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        setIsAdmin(true);
        setToken(data.token);
        if (typeof window !== 'undefined') {
          localStorage.setItem('watch_lib_admin_token', data.token);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Auth: Logout
  const handleLogout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    setIsAdmin(false);
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('watch_lib_admin_token');
    }
  };

  return {
    isAdmin,
    token,
    handleLogin,
    handleLogout,
    verifyToken,
  };
}
