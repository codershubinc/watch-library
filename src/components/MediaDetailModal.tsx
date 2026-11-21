import React from 'react';
import { X, Film, Tv, Star, Calendar, Tag, Plus, Minus, Edit2, Trash2, CheckCircle2, Bookmark, Clock, PauseCircle } from 'lucide-react';
import { MediaItem } from '../types';
import { CachedImage } from './CachedImage';

interface MediaDetailModalProps {
  item: MediaItem | null;
  isOpen: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onEdit: (item: MediaItem) => void;
  onDelete: (item: MediaItem) => void;
  onUpdateProgress: (item: MediaItem, season: number, episode: number) => void;
}

export const MediaDetailModal: React.FC<MediaDetailModalProps> = ({
  item,
  isOpen,
  isAdmin,
  onClose,
  onEdit,
  onDelete,
  onUpdateProgress,
}) => {
  if (!isOpen || !item) return null;

  const isSeries = item.type === 'series';
  const progress = item.progress;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div 
        id="media-detail-modal"
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl shadow-black my-8 relative"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-white/80 hover:text-white bg-black/50 hover:bg-black/80 rounded-full backdrop-blur-md transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Backdrop Banner */}
        <div className="relative h-48 sm:h-64 w-full bg-slate-950 overflow-hidden">
          <CachedImage
            src={item.backdropUrl || item.posterUrl}
            alt={item.title}
            className="filter brightness-75 blur-[1px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />

          {/* Type Badge on Banner */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md ${
              isSeries ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/30' : 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
            }`}>
              {isSeries ? <Tv className="w-3.5 h-3.5" /> : <Film className="w-3.5 h-3.5" />}
              {isSeries ? 'TV Series' : 'Feature Movie'}
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900/80 text-slate-300 border border-slate-700/80 backdrop-blur-md">
              {item.status === 'watching' && <Clock className="w-3.5 h-3.5 text-emerald-400" />}
              {item.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
              {item.status === 'plan_to_watch' && <Bookmark className="w-3.5 h-3.5 text-amber-400" />}
              {item.status === 'on_hold' && <PauseCircle className="w-3.5 h-3.5 text-slate-400" />}
              <span className="capitalize">{item.status.replace(/_/g, ' ')}</span>
            </span>
          </div>
        </div>

        {/* Content Details */}
        <div className="p-6 sm:p-8 -mt-16 sm:-mt-20 relative z-10 space-y-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Poster Thumbnail */}
            {item.posterUrl && (
              <div className="w-28 sm:w-36 shrink-0 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700/80 bg-slate-950">
                <CachedImage
                  src={item.posterUrl}
                  alt={item.title}
                />
              </div>
            )}

            {/* Title & Metadata Header */}
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {item.title}
              </h2>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-300 font-medium">
                {item.releaseYear && (
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span>{item.releaseYear}</span>
                  </div>
                )}

                {item.rating !== undefined && (
                  <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold text-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{item.rating.toFixed(1)} / 10</span>
                  </div>
                )}
              </div>

              {/* Genres */}
              {item.genres && item.genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {item.genres.map((g) => (
                    <span
                      key={g}
                      className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/60 font-medium"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Series Watching Progress Card */}
          {isSeries && progress && (
            <div className="p-5 rounded-2xl bg-orange-950/20 border border-orange-700/40 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                    Watching Progress
                  </span>
                  <div className="text-lg sm:text-xl font-mono font-extrabold text-white mt-0.5">
                    Season {progress.season} · Episode {progress.episode}
                    {progress.totalEpisodes && (
                      <span className="text-sm font-normal text-slate-400 ml-2">
                        (of {progress.totalEpisodes} episodes)
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-orange-500/20 text-orange-300 border border-orange-500/40">
                    S{progress.season} E{progress.episode}
                  </span>
                </div>
              </div>

              {/* Episode Progress Bar if total episodes given */}
              {progress.totalEpisodes && (
                <div className="space-y-1">
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.round((progress.episode / progress.totalEpisodes) * 100))}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{Math.round((progress.episode / progress.totalEpisodes) * 100)}% of Season {progress.season}</span>
                    <span>{progress.totalEpisodes - progress.episode} episodes remaining</span>
                  </div>
                </div>
              )}

              {/* Admin Quick Adjust Buttons */}
              {isAdmin && item.status !== 'completed' && (
                <div className="pt-2 border-t border-orange-800/40 flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-xs text-orange-300 font-medium">
                    Admin Quick Update:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateProgress(item, progress.season, Math.max(1, progress.episode - 1))}
                      disabled={progress.episode <= 1}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition"
                    >
                      <Minus className="w-3 h-3" />
                      <span>Prev Ep</span>
                    </button>
                    <button
                      onClick={() => onUpdateProgress(item, progress.season, progress.episode + 1)}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold transition shadow-sm"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Next Ep (E{progress.episode + 1})</span>
                    </button>
                    <button
                      onClick={() => onUpdateProgress(item, progress.season + 1, 1)}
                      className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-orange-300 border border-orange-700/50 transition font-medium"
                    >
                      Next Season (S{progress.season + 1})
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* Plot Summary */}
          {item.plot && (
            <div className="p-5 rounded-2xl bg-slate-800/20 border border-slate-700/30 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Plot Summary
              </span>
              <p className="text-sm text-slate-300 leading-relaxed">
                {item.plot}
              </p>
            </div>
          )}

          {/* Personal Review / Notes */}
          {item.notes ? (
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Personal Review & Notes
              </span>
              <p className="text-sm text-slate-200 leading-relaxed italic">
                "{item.notes}"
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950/30 border border-dashed border-slate-800 text-xs text-slate-500 italic text-center">
              No personal notes added yet.
            </div>
          )}

          {/* Footer with Admin Actions or Close */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Updated {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}
            </span>

            <div className="flex items-center gap-2">
              {isAdmin && (
                <>
                  <button
                    onClick={() => {
                      onClose();
                      onEdit(item);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Edit Details</span>
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onDelete(item);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-300 text-xs font-medium transition"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span>Delete</span>
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
