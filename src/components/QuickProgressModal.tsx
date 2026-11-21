import React, { useState, useEffect } from 'react';
import { X, Tv, CheckCircle2 } from 'lucide-react';
import { MediaItem } from '../types';

interface QuickProgressModalProps {
  item: MediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemId: string, season: number, episode: number, markCompleted?: boolean) => Promise<void>;
}

export const QuickProgressModal: React.FC<QuickProgressModalProps> = ({
  item,
  isOpen,
  onClose,
  onSave,
}) => {
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [markCompleted, setMarkCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item && item.progress) {
      setSeason(item.progress.season || 1);
      setEpisode(item.progress.episode || 1);
      setMarkCompleted(item.status === 'completed');
    }
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(item.id, Number(season), Number(episode), markCompleted);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div 
        id="quick-progress-modal" 
        className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl shadow-black/80 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <Tv className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white line-clamp-1">{item.title}</h3>
            <p className="text-xs text-orange-400 font-mono font-medium">Update Watching Progress</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Season
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-500">S</span>
                <input
                  type="number"
                  min="1"
                  required
                  value={season}
                  onChange={(e) => setSeason(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono text-base font-bold focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Episode
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-slate-500">E</span>
                <input
                  type="number"
                  min="1"
                  required
                  value={episode}
                  onChange={(e) => setEpisode(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono text-base font-bold focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="chk-mark-completed"
              checked={markCompleted}
              onChange={(e) => setMarkCompleted(e.target.checked)}
              className="rounded bg-slate-950 border-slate-700 text-orange-500 focus:ring-orange-500 w-4 h-4"
            />
            <label htmlFor="chk-mark-completed" className="text-xs text-slate-300 font-medium cursor-pointer flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
              Mark series as finished / Completed
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/60 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 rounded-xl transition shadow-md shadow-orange-500/20"
            >
              {isSubmitting ? 'Updating...' : `Save S${season} E${episode}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
