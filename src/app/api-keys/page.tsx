'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ApiKeysModal } from '@/components/ApiKeysModal';
import { useAdminAuth } from '@/hooks/useAdminAuth';

export default function ApiKeysPage() {
  const router = useRouter();
  const { isAdmin, token } = useAdminAuth();

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
          <h2 className="text-lg font-bold text-white">Administrator Access Required</h2>
          <p className="text-xs text-slate-400">
            Please log in as an administrator to manage API keys.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition"
          >
            Sign In as Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <ApiKeysModal isOpen={true} onClose={() => router.push('/')} token={token} />
    </div>
  );
}
