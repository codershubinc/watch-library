'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, RefreshCw } from 'lucide-react';

import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useLibrary } from '@/hooks/useLibrary';
import { Header } from '@/components/Header';
import { SpotlightSeries } from '@/components/SpotlightSeries';
import { FilterBar } from '@/components/FilterBar';
import { MediaGrid } from '@/components/MediaGrid';
import { PaginationControls } from '@/components/PaginationControls';
import { Footer } from '@/components/Footer';

import { AdminLoginModal } from '@/components/AdminLoginModal';
import { AddEditMediaModal } from '@/components/AddEditMediaModal';
import { MediaDetailModal } from '@/components/MediaDetailModal';
import { QuickProgressModal } from '@/components/QuickProgressModal';
import { MongoInfoModal } from '@/components/MongoInfoModal';
import { ImportModal } from '@/components/ImportModal';
import { ApiKeysModal } from '@/components/ApiKeysModal';
import { MediaItem } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const { isAdmin, token, handleLogin, handleLogout } = useAdminAuth();

  const {
    items,
    isLoading,
    error,
    dbStatus,
    searchQuery,
    setSearchQuery,
    selectedType,
    setSelectedType,
    selectedStatus,
    setSelectedStatus,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
    visibleCount,
    currentPage,
    itemsPerPage,
    totalPages,
    movieCount,
    seriesCount,
    currentlyWatchingSeries,
    filteredAndSortedItems,
    displayedItems,
    fetchLibrary,
    fetchDbStatus,
    handleSaveItem,
    handleQuickIncrementEpisode,
    handleSaveQuickProgress,
    handleUpdateProgressFromDetail,
    handleDeleteItem,
    handlePageChange,
    handleLoadMore,
    handleResetFilters,
  } = useLibrary(token);

  // Modal State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [detailItem, setDetailItem] = useState<MediaItem | null>(null);
  const [quickProgressItem, setQuickProgressItem] = useState<MediaItem | null>(null);
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isApiKeysModalOpen, setIsApiKeysModalOpen] = useState(false);

  // Infinite scroll intersection observer
  const loadMoreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (viewMode !== 'scroll') return;
    if (visibleCount >= filteredAndSortedItems.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '300px' }
    );

    const el = loadMoreRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [viewMode, visibleCount, filteredAndSortedItems.length, handleLoadMore]);

  const hasFilters = Boolean(searchQuery || selectedType !== 'all' || selectedStatus !== 'all');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 1. Top Header */}
      <Header
        isAdmin={isAdmin}
        onOpenLogin={() => router.push('/login')}
        onLogout={handleLogout}
        onOpenAddModal={() => {
          setEditingItem(null);
          setIsAddModalOpen(true);
        }}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenDbModal={() => setIsDbModalOpen(true)}
        onOpenApiKeysModal={() => setIsApiKeysModalOpen(true)}
        dbStatus={dbStatus}
        totalCount={items.length}
        movieCount={movieCount}
        seriesCount={seriesCount}
      />

      {/* 2. Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Spotlight Series Banner */}
        {selectedStatus !== 'completed' && (
          <SpotlightSeries
            seriesList={currentlyWatchingSeries}
            isAdmin={isAdmin}
            onSelectSeries={(series) => setDetailItem(series)}
            onQuickIncrementEpisode={handleQuickIncrementEpisode}
          />
        )}

        {/* Filter and Search Bar */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          sortBy={sortBy}
          onSortChange={setSortBy}
          count={filteredAndSortedItems.length}
        />

        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/30 border border-red-800/50 text-red-300 text-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchLibrary}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/60 hover:bg-red-800 text-white text-xs font-medium transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Media Grid */}
        <MediaGrid
          items={displayedItems}
          isLoading={isLoading}
          isAdmin={isAdmin}
          hasFilters={hasFilters}
          onOpenDetails={(selected) => setDetailItem(selected)}
          onEdit={(selected) => {
            setEditingItem(selected);
            setIsAddModalOpen(true);
          }}
          onDelete={handleDeleteItem}
          onQuickIncrementEpisode={handleQuickIncrementEpisode}
          onOpenQuickProgress={(selected) => setQuickProgressItem(selected)}
          onResetFilters={handleResetFilters}
          onOpenAddModal={() => {
            setEditingItem(null);
            setIsAddModalOpen(true);
          }}
        />

        {/* Pagination & Scroll Controls */}
        <PaginationControls
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          visibleCount={visibleCount}
          totalFilteredItems={filteredAndSortedItems.length}
          displayedCount={displayedItems.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onLoadMore={handleLoadMore}
          loadMoreRef={loadMoreRef}
        />
      </main>

      {/* 3. Footer */}
      <Footer
        totalCount={items.length}
        dbStatus={dbStatus}
        isAdmin={isAdmin}
        onOpenDbModal={() => setIsDbModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* 4. Modals */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
      />

      <AddEditMediaModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingItem(null);
        }}
        onSave={async (data) => {
          await handleSaveItem(data, editingItem);
        }}
        initialData={editingItem}
      />

      <MediaDetailModal
        item={detailItem}
        isOpen={Boolean(detailItem)}
        isAdmin={isAdmin}
        onClose={() => setDetailItem(null)}
        onEdit={(item) => {
          setEditingItem(item);
          setIsAddModalOpen(true);
        }}
        onDelete={handleDeleteItem}
        onUpdateProgress={async (item, season, episode) => {
          const updated = await handleUpdateProgressFromDetail(item, season, episode);
          if (updated) setDetailItem(updated);
        }}
      />

      <QuickProgressModal
        item={quickProgressItem}
        isOpen={Boolean(quickProgressItem)}
        onClose={() => setQuickProgressItem(null)}
        onSave={async (itemId, season, episode, markCompleted) => {
          const updated = await handleSaveQuickProgress(itemId, season, episode, markCompleted);
          if (detailItem?.id === updated.id) setDetailItem(updated);
        }}
      />

      <MongoInfoModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        status={dbStatus}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={() => {
          setIsImportModalOpen(false);
          fetchLibrary();
          fetchDbStatus();
        }}
      />

      <ApiKeysModal
        isOpen={isApiKeysModalOpen}
        onClose={() => setIsApiKeysModalOpen(false)}
        token={token}
      />
    </div>
  );
}
