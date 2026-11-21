import React from 'react';
import { Film, Plus } from 'lucide-react';
import { MediaItem } from '../types';
import { MediaCard } from './MediaCard';

interface MediaGridProps {
  items: MediaItem[];
  isLoading: boolean;
  isAdmin: boolean;
  hasFilters: boolean;
  onOpenDetails: (item: MediaItem) => void;
  onEdit: (item: MediaItem) => void;
  onDelete: (item: MediaItem) => void;
  onQuickIncrementEpisode: (item: MediaItem) => void;
  onOpenQuickProgress: (item: MediaItem) => void;
  onResetFilters: () => void;
  onOpenAddModal: () => void;
}

export const MediaGrid: React.FC<MediaGridProps> = ({
  items,
  isLoading,
  isAdmin,
  hasFilters,
  onOpenDetails,
  onEdit,
  onDelete,
  onQuickIncrementEpisode,
  onOpenQuickProgress,
  onResetFilters,
  onOpenAddModal,
}) => {
  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Loading watch library...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-16 sm:py-24 text-center px-4 rounded-2xl border border-dashed border-slate-800 bg-slate-900/20">
        <div className="w-12 h-12 rounded-2xl bg-slate-800/80 mx-auto flex items-center justify-center text-slate-400 mb-3">
          <Film className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white mb-1">No matching titles found</h3>
        <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto mb-4">
          {hasFilters
            ? 'Try adjusting or clearing your filters to see more movies and series.'
            : 'Your library is currently empty. As the admin, start cataloging your watch history!'}
        </p>
        {hasFilters ? (
          <button
            onClick={onResetFilters}
            className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition"
          >
            Reset All Filters
          </button>
        ) : isAdmin ? (
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Your First Title</span>
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div
      id="movies-series-grid"
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-5"
    >
      {items.map((item) => (
        <MediaCard
          key={item.id}
          item={item}
          isAdmin={isAdmin}
          onOpenDetails={onOpenDetails}
          onEdit={onEdit}
          onDelete={onDelete}
          onQuickIncrementEpisode={onQuickIncrementEpisode}
          onOpenQuickProgress={onOpenQuickProgress}
        />
      ))}
    </div>
  );
};
