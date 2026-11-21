'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { LoginPage } from '@/components/LoginPage';
import { useAdminAuth } from '@/hooks/useAdminAuth';

export default function AdminLoginPage() {
  const router = useRouter();
  const { isAdmin, handleLogin, handleLogout } = useAdminAuth();

  return (
    <LoginPage
      isAdmin={isAdmin}
      onLogin={handleLogin}
      onNavigateHome={() => router.push('/')}
      onLogout={handleLogout}
    />
  );
}
