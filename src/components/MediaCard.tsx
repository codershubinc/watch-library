import React from 'react';
import { Film, Tv, Star, Plus, Edit2, Trash2, Clock, CheckCircle2, Bookmark, PauseCircle } from 'lucide-react';
import { MediaItem } from '../types';
import { CachedImage } from './CachedImage';

interface MediaCardProps {
  item: MediaItem;
  isAdmin: boolean;
  onOpenDetails: (item: MediaItem) => void;
  onEdit: (item: MediaItem) => void;
  onDelete: (item: MediaItem) => void;
  onQuickIncrementEpisode: (item: MediaItem) => void;
  onOpenQuickProgress: (item: MediaItem) => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  item,
  isAdmin,
  onOpenDetails,
  onEdit,
  onDelete,
  onQuickIncrementEpisode,
  onOpenQuickProgress,
}) => {
  const isSeries = item.type === 'series';
  const progress = item.progress;



  return (
    <div 
      id={`media-card-${item.id}`}
      className="group relative flex flex-col bg-slate-900/90 border border-slate-800/80 rounded-2xl overflow-hidden hover:border-slate-700 hover:shadow-xl hover:shadow-black/50 transition-all duration-300"
    >
      {/* Poster Image with 2:3 Aspect Ratio */}
      <div 
        onClick={() => onOpenDetails(item)}
        className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950 cursor-pointer"
      >
        {item.posterUrl ? (
          <CachedImage
            src={item.posterUrl}
            alt={item.title}
            className="group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-slate-600 bg-gradient-to-b from-slate-900 to-slate-950">
            {isSeries ? <Tv className="w-10 h-10 mb-2 opacity-50" /> : <Film className="w-10 h-10 mb-2 opacity-50" />}
            <span className="text-xs text-center font-medium line-clamp-2 text-slate-400">{item.title}</span>
          </div>
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />

        {/* Hover Info Overlay */}
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4 text-center z-0">
          <h3 className="text-base sm:text-lg font-bold text-white mb-2 line-clamp-4 leading-tight">
            {item.title}
          </h3>
          
          {item.releaseYear && (
            <span className="text-xs text-amber-400 font-semibold mb-2 tracking-widest">{item.releaseYear}</span>
          )}

          {typeof item.rating === 'number' && !isNaN(item.rating) && (
            <div className="flex items-center gap-1 text-slate-300 text-xs font-medium mb-4">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {item.rating.toFixed(1)} / 10
            </div>
          )}

          {item.genres && item.genres.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 mt-1">
              {item.genres.slice(0, 3).map((g) => (
                <span key={g} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/60 font-medium tracking-wide">
                  {g}
                </span>
              ))}
              {item.genres.length > 3 && (
                <span className="text-[10px] px-1 py-0.5 text-slate-500 font-medium">
                  +{item.genres.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Top Badges: Category only on Top Right */}
        <div className="absolute top-2.5 right-2.5 flex items-center justify-end gap-1 pointer-events-none group-hover:opacity-0 transition-opacity">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider backdrop-blur-md shadow-sm ${
            isSeries ? 'bg-orange-500/90 text-slate-950' : 'bg-slate-900/90 text-amber-300 border border-amber-500/30'
          }`}>
            {isSeries ? <Tv className="w-2.5 h-2.5" /> : <Film className="w-2.5 h-2.5" />}
            {isSeries ? 'SERIES' : 'MOVIE'}
          </span>
        </div>

        {/* Top Right Admin Quick Action Overlay */}
        {isAdmin && (
          <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-slate-950/80 backdrop-blur-md p-1 rounded-lg border border-slate-800">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
              title="Edit Title"
              className="p-1.5 text-slate-300 hover:text-amber-400 hover:bg-slate-800 rounded-md transition"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item);
              }}
              title="Delete Title"
              className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-slate-800 rounded-md transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Bottom Poster Overlay: Rating & Series Progress (e.g. S1 E2) */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex flex-col gap-1.5">


          {/* SERIES WATCHING PROGRESS BADGE (s1 e2) */}
          {isSeries && progress && (
            <div className="w-full bg-slate-950/90 backdrop-blur-md border border-orange-500/40 rounded-lg p-1.5 flex items-center justify-between shadow-lg">
              <div 
                onClick={(e) => {
                  if (isAdmin) {
                    e.stopPropagation();
                    onOpenQuickProgress(item);
                  }
                }}
                className={`flex items-center gap-1.5 ${isAdmin ? 'cursor-pointer hover:text-orange-300' : ''}`}
                title={isAdmin ? 'Click to adjust progress' : undefined}
              >
                {item.status === 'watching' && (
                  <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse shrink-0" />
                )}
                <span className="text-xs font-mono font-extrabold text-orange-400 tracking-tight">
                  Season {progress.season}
                </span>
              </div>

              {/* Admin Quick +1 Episode Button */}
              {isAdmin && item.status !== 'completed' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickIncrementEpisode(item);
                  }}
                  title="Mark +1 Episode watched"
                  className="flex items-center gap-0.5 px-2 py-0.5 rounded bg-orange-500 hover:bg-orange-400 active:scale-95 text-slate-950 text-[10px] font-extrabold transition shadow-sm"
                >
                  <Plus className="w-2.5 h-2.5" />
                  <span>1 Ep</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div 
        onClick={() => onOpenDetails(item)}
        className="p-3.5 flex flex-col flex-1 justify-center cursor-pointer bg-slate-900/90"
      >
        <h3 className="text-sm font-bold text-slate-100 group-hover:text-amber-400 transition line-clamp-1 text-center">
          {item.title}
        </h3>
      </div>
    </div>
  );
};
