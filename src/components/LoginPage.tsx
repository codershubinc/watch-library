import React, { useState, useRef, useEffect } from 'react';
import { Film, Lock, Key, Eye, EyeOff, AlertCircle, ArrowLeft, ShieldCheck, LogOut, CheckCircle2 } from 'lucide-react';

interface LoginPageProps {
  isAdmin: boolean;
  onLogin: (password: string) => Promise<boolean>;
  onNavigateHome: () => void;
  onLogout: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  isAdmin,
  onLogin,
  onNavigateHome,
  onLogout,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter your admin passcode.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await onLogin(password.trim());
      if (success) {
        setLoginSuccess(true);
        setTimeout(() => {
          onNavigateHome();
        }, 600);
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check server connectivity.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navbar */}
      <header className="w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-3 text-left group transition cursor-pointer"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 group-hover:scale-105 transition-transform">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                Watch Library
              </h1>
              <span className="text-xs text-slate-400 hidden sm:inline">Personal collection manager</span>
            </div>
          </button>

          <button
            onClick={onNavigateHome}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 rounded-xl border border-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Library</span>
          </button>
        </div>
      </header>

      {/* Main Content Card Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 relative overflow-hidden backdrop-blur-xl">
          {/* Subtle amber gradient glow in top corner */}
          <div className="absolute -top-20 -right-20 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* If already authenticated as Admin */}
          {isAdmin ? (
            <div className="text-center py-4 space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-lg shadow-amber-500/10">
                <ShieldCheck className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-white">Already Authenticated</h2>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  You are currently logged in with active administrator privileges.
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  onClick={onNavigateHome}
                  className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-bold text-sm transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  <Film className="w-4 h-4" />
                  <span>Return to Library</span>
                </button>

                <button
                  onClick={onLogout}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-xs transition border border-slate-700/60 flex items-center justify-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-400" />
                  <span>Log Out of Admin Mode</span>
                </button>
              </div>
            </div>
          ) : (
            /* Normal Login Form */
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-lg shadow-amber-500/10">
                  <Lock className="w-7 h-7" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">Owner / Admin Sign In</h2>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Enter your admin passcode to unlock editing, adding titles, and managing episode progress.
                </p>
              </div>

              {loginSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2.5 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Authentication successful! Redirecting to library...</span>
                </div>
              )}

              {error && (
                <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2.5 animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label 
                    htmlFor="admin-password-input" 
                    className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2"
                  >
                    Admin Passcode
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      ref={inputRef}
                      id="admin-password-input"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter admin passcode..."
                      disabled={isLoading || loginSuccess}
                      className="w-full pl-10 pr-11 py-3 bg-slate-950/90 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  id="btn-submit-login"
                  type="submit"
                  disabled={isLoading || loginSuccess}
                  className="w-full py-3 px-4 text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 active:scale-[0.99] rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Verifying Passcode...</span>
                    </>
                  ) : (
                    <span>Unlock Admin Mode</span>
                  )}
                </button>
              </form>

              <div className="pt-2 border-t border-slate-800/80 text-center">
                <p className="text-[11px] text-slate-400">
                  Authentication is managed securely in MongoDB (<code className="text-amber-400 font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">admin_auth</code> collection).
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-5 text-center text-xs text-slate-400 border-t border-slate-800/60">
        <p>Watch Library • Protected Administration Portal</p>
      </footer>
    </div>
  );
};
