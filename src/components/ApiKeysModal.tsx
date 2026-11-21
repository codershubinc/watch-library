import React, { useState, useEffect, useCallback } from 'react';
import { X, Key, Plus, Trash2, Copy, Check, Shield, AlertTriangle, Code, Terminal, Clock } from 'lucide-react';
import { ApiKeyItem, GeneratedApiKey } from '../models';

interface ApiKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
}

export const ApiKeysModal: React.FC<ApiKeysModalProps> = ({ isOpen, onClose, token }) => {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Key creation state
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyScope, setNewKeyScope] = useState<'full_access' | 'read_only'>('full_access');
  const [isCreating, setIsCreating] = useState(false);
  const [recentlyGeneratedKey, setRecentlyGeneratedKey] = useState<GeneratedApiKey | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [activeTab, setActiveTab] = useState<'keys' | 'docs'>('keys');

  const fetchKeys = useCallback(async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/keys', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load API keys');
      const data = await res.json();
      setKeys(data.keys || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch API keys');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isOpen) {
      fetchKeys();
      setRecentlyGeneratedKey(null);
      setNewKeyName('');
    }
  }, [isOpen, fetchKeys]);

  if (!isOpen) return null;

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim() || !token) return;

    try {
      setIsCreating(true);
      setError(null);
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newKeyName.trim(),
          scope: newKeyScope,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to generate API key');
      }

      const generated: GeneratedApiKey = await res.json();
      setRecentlyGeneratedKey(generated);
      setNewKeyName('');
      setKeys((prev) => [generated, ...prev]);
    } catch (err: any) {
      setError(err?.message || 'Error generating key');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevokeKey = async (id: string, name: string) => {
    if (!token) return;
    if (!window.confirm(`Are you sure you want to revoke API key "${name}"? Any external projects using this key will immediately lose access.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/keys/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to revoke key');
      setKeys((prev) => prev.filter((k) => k.id !== id));
      if (recentlyGeneratedKey?.id === id) {
        setRecentlyGeneratedKey(null);
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to revoke key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">API Keys Dashboard</h2>
              <p className="text-xs text-slate-400">Manage Bearer tokens to access Watch Library from your other projects</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800/80 px-6 bg-slate-950/50">
          <button
            onClick={() => setActiveTab('keys')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'keys'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Active Keys ({keys.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'docs'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Integration Examples</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {activeTab === 'keys' ? (
            <>
              {/* Newly Generated Key Banner */}
              {recentlyGeneratedKey && (
                <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-700/50 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Copy your new API Key now. For security, it will never be displayed again!</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-amber-500/30">
                    <code className="text-xs font-mono text-amber-300 flex-1 break-all select-all">
                      {recentlyGeneratedKey.rawKey}
                    </code>
                    <button
                      onClick={() => copyToClipboard(recentlyGeneratedKey.rawKey)}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm"
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Generate New Key Form */}
              <form onSubmit={handleCreateKey} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Create New API Key</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="Key description (e.g. Portfolio Website, iOS App)"
                    className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    disabled={isCreating}
                  />
                  <select
                    value={newKeyScope}
                    onChange={(e) => setNewKeyScope(e.target.value as any)}
                    className="px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                    disabled={isCreating}
                  >
                    <option value="full_access">Full Access (Read/Write)</option>
                    <option value="read_only">Read Only</option>
                  </select>
                  <button
                    type="submit"
                    disabled={isCreating || !newKeyName.trim()}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shrink-0 shadow-md shadow-amber-500/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Generate Key</span>
                  </button>
                </div>
              </form>

              {/* List of Keys */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Active API Keys</h3>

                {isLoading ? (
                  <div className="py-8 text-center text-xs text-slate-400">Loading keys...</div>
                ) : keys.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-slate-800 text-xs text-slate-400">
                    No API keys generated yet. Create a key above to start making authenticated calls from other projects.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {keys.map((k) => (
                      <div
                        key={k.id}
                        className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition"
                      >
                        <div className="overflow-hidden space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white truncate">{k.name}</span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              k.scope === 'read_only'
                                ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            }`}>
                              {k.scope === 'read_only' ? 'Read Only' : 'Read & Write'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                            <span>Prefix: {k.keyPrefix}</span>
                            <span>•</span>
                            <span>Created: {new Date(k.createdAt).toLocaleDateString()}</span>
                            {k.lastUsedAt && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-slate-400">
                                  <Clock className="w-3 h-3" />
                                  Used: {new Date(k.lastUsedAt).toLocaleDateString()}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleRevokeKey(k.id, k.name)}
                          title="Revoke Key"
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Integration Code Snippets */
            <div className="space-y-5 text-xs text-slate-300">
              <div>
                <h4 className="font-bold text-white mb-1">Using API Keys as Bearer Tokens</h4>
                <p className="text-slate-400">
                  Include your generated key in the <code className="text-amber-400 bg-slate-950 px-1 py-0.5 rounded">Authorization</code> HTTP header as a <code className="text-amber-400 bg-slate-950 px-1 py-0.5 rounded">Bearer</code> token.
                </p>
              </div>

              {/* cURL Example */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
                  <Terminal className="w-3.5 h-3.5 text-amber-400" />
                  <span>cURL Command</span>
                </div>
                <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
{`curl -X GET "http://localhost:3001/api/movies" \\
  -H "Authorization: Bearer wl_live_YOUR_API_KEY"`}
                </pre>
              </div>

              {/* JavaScript / Fetch Example */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
                  <Code className="w-3.5 h-3.5 text-emerald-400" />
                  <span>JavaScript / TypeScript (Fetch API)</span>
                </div>
                <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
{`const res = await fetch('http://localhost:3001/api/series', {
  headers: {
    'Authorization': 'Bearer wl_live_YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});
const data = await res.json();
console.log('Series list:', data.series);`}
                </pre>
              </div>

              {/* Python Example */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
                  <Code className="w-3.5 h-3.5 text-sky-400" />
                  <span>Python (requests)</span>
                </div>
                <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
{`import requests

headers = {
    "Authorization": "Bearer wl_live_YOUR_API_KEY",
}
response = requests.get("http://localhost:3001/api/movies", headers=headers)
print(response.json())`}
                </pre>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition"
          >
            Close Dashboard
          </button>
        </div>

      </div>
    </div>
  );
};
