import React from 'react';
import { Film, Tv, Lock, Unlock, Plus, Database, Eye, ShieldCheck, LogOut, UploadCloud } from 'lucide-react';
import { DbStatus } from '../types';

interface HeaderProps {
  isAdmin: boolean;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenAddModal: () => void;
  onOpenImportModal: () => void;
  onOpenDbModal: () => void;
  dbStatus: DbStatus | null;
  totalCount: number;
  seriesCount: number;
  movieCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  isAdmin,
  onOpenLogin,
  onLogout,
  onOpenAddModal,
  onOpenImportModal,
  onOpenDbModal,
  dbStatus,
  totalCount,
  seriesCount,
  movieCount,
}) => {
  return (
    <header id="main-header" className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950">
              <Film className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  Watch Library
                </h1>
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <ShieldCheck className="w-3 h-3 text-amber-400" />
                    Admin
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800/70 text-slate-400 border border-slate-700/50">
                    <Eye className="w-3 h-3 text-slate-400" />
                    Viewer
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                My personal collection of movies & watched series progress
              </p>
            </div>
          </div>

          {/* Center Quick Stats (Visible on desktop) */}
          <div className="hidden md:flex items-center gap-4 text-xs text-slate-400 bg-slate-900/60 px-3.5 py-1.5 rounded-lg border border-slate-800">
            <div className="flex items-center gap-1.5 font-medium text-slate-300">
              <Film className="w-3.5 h-3.5 text-amber-400" />
              <span>{movieCount} Movies</span>
            </div>
            <span className="text-slate-700">•</span>
            <div className="flex items-center gap-1.5 font-medium text-slate-300">
              <Tv className="w-3.5 h-3.5 text-orange-400" />
              <span>{seriesCount} Series</span>
            </div>
            <span className="text-slate-700">•</span>
            <span className="text-slate-400">{totalCount} Total Titles</span>
          </div>

          {/* Right Action Controls: DB Status & Admin Authentication */}
          <div className="flex items-center gap-2.5">

            {/* Admin Controls */}
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <button
                  id="btn-import-media"
                  onClick={onOpenImportModal}
                  title="Bulk Import"
                  className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-400 active:scale-95 text-white text-xs sm:text-sm font-semibold px-2.5 sm:px-3 py-2 rounded-lg transition shadow-md shadow-indigo-500/20"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span className="hidden sm:inline">Import</span>
                </button>
                <button
                  id="btn-add-media"
                  onClick={onOpenAddModal}
                  className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-lg transition shadow-md shadow-amber-500/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Title</span>
                </button>
                <button
                  id="btn-logout-admin"
                  onClick={onLogout}
                  title="Logout from admin mode"
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-medium px-2.5 sm:px-3 py-2 rounded-lg border border-slate-700 transition"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                id="btn-header-login"
                onClick={onOpenLogin}
                title="Sign in as Admin"
                className="flex items-center gap-1.5 bg-slate-850 hover:bg-slate-800 active:scale-95 text-slate-200 hover:text-white text-xs sm:text-sm font-medium px-3 sm:px-3.5 py-2 rounded-xl border border-slate-700/80 hover:border-amber-500/40 transition shadow-sm"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
