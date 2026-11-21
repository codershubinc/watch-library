import React from 'react';
import { Search, Film, Tv, Clock, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { MediaType, WatchStatus } from '../types';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedType: MediaType | 'all';
  onTypeChange: (type: MediaType | 'all') => void;
  selectedStatus: WatchStatus | 'all';
  onStatusChange: (status: WatchStatus | 'all') => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  count: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedStatus,
  onStatusChange,
  sortBy,
  onSortChange,
  count,
}) => {
  return (
    <div className="w-full space-y-3.5 mb-6">
      {/* Top row: Search bar and Sort selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="library-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by title, genre, notes..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300"
            >
              Clear
            </button>
          )}
        </div>

        {/* Sort selector & Count */}
        <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Sort:</span>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="recent_updated" className="bg-slate-900 text-slate-200">Recently Updated</option>
              <option value="rating_high" className="bg-slate-900 text-slate-200">Highest Rated</option>
              <option value="year_new" className="bg-slate-900 text-slate-200">Release Year (Newest)</option>
              <option value="title_asc" className="bg-slate-900 text-slate-200">Title (A - Z)</option>
            </select>
          </div>

          <span className="text-slate-500 font-medium whitespace-nowrap">
            Showing <strong className="text-slate-200 font-bold">{count}</strong> titles
          </span>
        </div>
      </div>

      {/* Bottom row: Filter Chips */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
        {/* Type pills: All, Movies, TV Series */}
        <div className="flex items-center gap-1.5 bg-slate-950/70 p-1 rounded-xl border border-slate-800/80">
          <button
            onClick={() => onTypeChange('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              selectedType === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => onTypeChange('movie')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition ${
              selectedType === 'movie'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Film className="w-3 h-3" />
            <span>Movies</span>
          </button>
          <button
            onClick={() => onTypeChange('series')}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition ${
              selectedType === 'series'
                ? 'bg-orange-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tv className="w-3 h-3" />
            <span>Series</span>
          </button>
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1 overflow-x-auto py-1 max-w-full">
          {[
            { id: 'all', label: 'All Statuses' },
            { id: 'watching', label: 'Currently Watching' },
            { id: 'completed', label: 'Completed' },
            { id: 'plan_to_watch', label: 'Plan to Watch' },
            { id: 'on_hold', label: 'On Hold' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => onStatusChange(st.id as WatchStatus | 'all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap border transition ${
                selectedStatus === st.id
                  ? 'bg-slate-800 text-white border-slate-600 shadow-sm'
                  : 'bg-transparent text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
