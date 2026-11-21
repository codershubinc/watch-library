import React from 'react';
import { X, Database, CheckCircle2, Server, Copy, Check } from 'lucide-react';
import { DbStatus } from '../types';

interface MongoInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: DbStatus | null;
}

export const MongoInfoModal: React.FC<MongoInfoModalProps> = ({
  isOpen,
  onClose,
  status,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const exampleUri = 'mongodb+srv://<username>:<password>@cluster0.mongodb.net/watch_library?retryWrites=true&w=majority';

  const copyUri = () => {
    navigator.clipboard.writeText(exampleUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div 
        id="mongo-info-modal" 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl shadow-black relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Database & Persistence</h3>
            <p className="text-xs text-slate-400">MongoDB configuration & storage status</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Active Status Box */}
          <div className={`p-4 rounded-xl border ${
            status?.connected 
              ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300' 
              : 'bg-slate-950/70 border-slate-800 text-slate-300'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-2.5 h-2.5 rounded-full ${status?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="font-bold text-sm">
                {status?.connected ? 'Connected to MongoDB' : 'Active: Local Persistent Fallback Store'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {status?.message || 'Ready for library cataloging.'}
            </p>
          </div>

          {/* Guide for Connecting MongoDB Atlas */}
          <div className="space-y-2 text-xs text-slate-300">
            <h4 className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-amber-400" />
              How to connect your MongoDB Atlas cluster:
            </h4>
            <ol className="list-decimal pl-5 space-y-1.5 text-slate-400">
              <li>Open your MongoDB Atlas dashboard (cloud.mongodb.com).</li>
              <li>Click <strong>Connect</strong> on your database deployment & choose <strong>Drivers (Node.js)</strong>.</li>
              <li>Copy your connection URI and set the <code className="text-amber-400 bg-slate-950 px-1 py-0.5 rounded">MONGODB_URI</code> environment variable.</li>
              <li>The server will automatically link and store all titles in your MongoDB database!</li>
            </ol>
          </div>

          {/* Example URI snippet */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Example format:</span>
              <button
                onClick={copyUri}
                className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <code className="text-[11px] font-mono text-slate-300 break-all block">
              {exampleUri}
            </code>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
