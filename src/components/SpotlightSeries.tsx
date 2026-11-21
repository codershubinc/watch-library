import React from 'react';
import { Tv, Plus } from 'lucide-react';
import { MediaItem } from '../types';
import { CachedImage } from './CachedImage';

interface SpotlightSeriesProps {
  seriesList: MediaItem[];
  isAdmin: boolean;
  onSelectSeries: (series: MediaItem) => void;
  onQuickIncrementEpisode: (series: MediaItem) => void;
}

export const SpotlightSeries: React.FC<SpotlightSeriesProps> = ({
  seriesList,
  isAdmin,
  onSelectSeries,
  onQuickIncrementEpisode,
}) => {
  if (seriesList.length === 0) return null;

  return (
    <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-orange-950/40 via-slate-900/60 to-slate-900 border border-orange-700/30 shadow-lg">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-ping" />
          <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
            <Tv className="w-4 h-4" />
            Currently Watching Series Progress
          </h2>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          {seriesList.length} Active {seriesList.length === 1 ? 'Show' : 'Shows'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {seriesList.map((series) => (
          <div
            key={series.id}
            onClick={() => onSelectSeries(series)}
            className="group flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-orange-900/40 hover:border-orange-500/50 cursor-pointer transition"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              {series.posterUrl && (
                <div className="w-10 h-14 shrink-0 rounded-lg overflow-hidden border border-slate-800">
                  <CachedImage
                    src={series.posterUrl}
                    alt={series.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="overflow-hidden">
                <h4 className="text-sm font-bold text-white group-hover:text-orange-400 transition truncate">
                  {series.title}
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-mono font-extrabold text-orange-400">
                    S{series.progress?.season || 1} · E{series.progress?.episode || 1}
                  </span>
                  {series.progress?.totalEpisodes && (
                    <span className="text-[11px] text-slate-400">
                      / {series.progress.totalEpisodes} eps
                    </span>
                  )}
                </div>
              </div>
            </div>

            {isAdmin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickIncrementEpisode(series);
                }}
                title="Mark next episode as watched"
                className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 active:scale-95 text-slate-950 text-xs font-extrabold transition shadow-sm ml-2"
              >
                <Plus className="w-3 h-3" />
                <span>1 Ep</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
