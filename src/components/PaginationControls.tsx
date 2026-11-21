import React from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationControlsProps {
  viewMode: 'scroll' | 'pages';
  onViewModeChange: (mode: 'scroll' | 'pages') => void;
  visibleCount: number;
  totalFilteredItems: number;
  displayedCount: number;
  itemsPerPage: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLoadMore: () => void;
  loadMoreRef?: React.RefObject<HTMLDivElement | null>;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  viewMode,
  onViewModeChange,
  visibleCount,
  totalFilteredItems,
  displayedCount,
  itemsPerPage,
  currentPage,
  totalPages,
  onPageChange,
  onLoadMore,
  loadMoreRef,
}) => {
  if (totalFilteredItems <= itemsPerPage) return null;

  return (
    <div className="mt-10 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Mode Selector Toggle */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <div className="inline-flex rounded-xl bg-slate-900 border border-slate-800 p-0.5">
          <button
            onClick={() => onViewModeChange('scroll')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'scroll'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Infinite Scroll
          </button>
          <button
            onClick={() => onViewModeChange('pages')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'pages'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Numbered Pages
          </button>
        </div>
      </div>

      {/* Infinite Scroll Controls */}
      {viewMode === 'scroll' ? (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <span className="text-xs text-slate-400 font-medium">
            Showing {displayedCount} of {totalFilteredItems} titles
          </span>
          {visibleCount < totalFilteredItems ? (
            <>
              <button
                onClick={onLoadMore}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white transition shadow-sm active:scale-95"
              >
                <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                <span>Load More ({totalFilteredItems - visibleCount} left)</span>
              </button>
              {/* Sentinel element to trigger auto-scroll load */}
              {loadMoreRef && <div ref={loadMoreRef} className="h-4 w-4" />}
            </>
          ) : (
            <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-400">
              ✓ All {totalFilteredItems} titles loaded
            </span>
          )}
        </div>
      ) : (
        /* Numbered Pages Pagination Controls */
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none border border-slate-800 text-xs font-medium text-slate-300 transition"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === totalPages ||
                  (p >= currentPage - 1 && p <= currentPage + 1)
              )
              .map((p, idx, arr) => {
                const showEllipsisBefore = idx > 0 && p > arr[idx - 1] + 1;
                return (
                  <React.Fragment key={p}>
                    {showEllipsisBefore && (
                      <span className="px-1 text-xs text-slate-600">...</span>
                    )}
                    <button
                      onClick={() => onPageChange(p)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition ${
                        currentPage === p
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                          : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}
          </div>

          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none border border-slate-800 text-xs font-medium text-slate-300 transition"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <span className="text-xs text-slate-400 ml-2 font-medium">
            Page {currentPage} of {totalPages}
          </span>
        </div>
      )}
    </div>
  );
};
