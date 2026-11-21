import React from 'react';
import Link from 'next/link';
import { DbStatus } from '../types';

interface FooterProps {
  totalCount: number;
  dbStatus: DbStatus | null;
  isAdmin: boolean;
  onOpenDbModal: () => void;
  onLogout: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  totalCount,
  dbStatus,
  isAdmin,
  onOpenDbModal,
  onLogout,
}) => {
  return (
    <footer className="w-full border-t border-slate-800/80 py-6 text-center text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>
          Personal Movies & Series Watch Library • {totalCount} titles cataloged
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/doc"
            className="text-amber-400 hover:text-amber-300 font-medium transition"
          >
            API Docs
          </Link>
          <span>•</span>
          <button
            onClick={onOpenDbModal}
            className="text-slate-400 hover:text-slate-200 transition"
          >
            Storage: {dbStatus?.connected ? 'MongoDB' : 'Local Fallback'}
          </button>
          {isAdmin && (
            <>
              <span>•</span>
              <button
                onClick={onLogout}
                className="text-amber-400 hover:text-amber-300 transition"
              >
                Exit Admin Mode
              </button>
            </>
          )}
        </div>
      </div>
    </footer>
  );
};
