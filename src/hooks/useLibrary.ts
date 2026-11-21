import { useState, useEffect, useMemo, useCallback } from 'react';
import { MediaItem, MediaType, WatchStatus, DbStatus } from '../types';

export function useLibrary(token: string | null) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);

  // Filtering & Sorting State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<MediaType | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<WatchStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState('recent_updated');

  // Pagination & Scroll Loading State
  const [viewMode, setViewMode] = useState<'scroll' | 'pages'>('scroll');
  const [visibleCount, setVisibleCount] = useState(24);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;

  // Reset pagination on filter or sort change
  useEffect(() => {
    setVisibleCount(24);
    setCurrentPage(1);
  }, [searchQuery, selectedType, selectedStatus, sortBy]);

  // Fetch Library items
  const fetchLibrary = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/library?limit=1000');
      if (!res.ok) throw new Error('Failed to fetch library');
      const data = await res.json();
      if (Array.isArray(data)) {
        setItems(data);
      } else if (data && Array.isArray(data.items)) {
        setItems(data.items);
      } else {
        setItems([]);
      }
    } catch (err: any) {
      console.error(err);
      setError('Could not load library. Please ensure the server is running.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch Database status
  const fetchDbStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
      }
    } catch (err) {
      console.warn('Could not fetch DB status:', err);
    }
  }, []);

  useEffect(() => {
    fetchDbStatus();
    fetchLibrary();
  }, [fetchDbStatus, fetchLibrary]);

  // Admin: Save (Add or Update)
  const handleSaveItem = async (
    itemData: Partial<MediaItem>,
    editingItem: MediaItem | null
  ): Promise<MediaItem> => {
    if (!token) throw new Error('Admin authentication required');

    if (editingItem) {
      const res = await fetch(`/api/library/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(itemData),
      });
      if (!res.ok) throw new Error('Failed to update title');
      const updated = await res.json();
      setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      return updated;
    } else {
      const res = await fetch('/api/library', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(itemData),
      });
      if (!res.ok) throw new Error('Failed to add title');
      const created = await res.json();
      setItems((prev) => [created, ...prev]);
      return created;
    }
  };

  // Admin: Quick +1 Episode
  const handleQuickIncrementEpisode = async (item: MediaItem) => {
    if (!token || !item.progress) return;
    const nextEpisode = item.progress.episode + 1;
    try {
      const res = await fetch(`/api/library/${item.id}/progress`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          season: item.progress.season,
          episode: nextEpisode,
        }),
      });
      if (!res.ok) throw new Error('Failed to update episode');
      const updated = await res.json();
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      return updated;
    } catch (err) {
      console.error(err);
    }
  };

  // Admin: Save Quick Progress from Modal
  const handleSaveQuickProgress = async (
    itemId: string,
    season: number,
    episode: number,
    markCompleted?: boolean
  ): Promise<MediaItem> => {
    if (!token) throw new Error('Admin authentication required');
    const body: any = { season, episode };
    if (markCompleted) body.status = 'completed';

    const res = await fetch(`/api/library/${itemId}/progress`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error('Failed to update watching progress');
    const updated = await res.json();
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    return updated;
  };

  // Admin: Update Progress from Detail Modal
  const handleUpdateProgressFromDetail = async (
    item: MediaItem,
    season: number,
    episode: number
  ): Promise<MediaItem | undefined> => {
    if (!token) return;
    try {
      const res = await fetch(`/api/library/${item.id}/progress`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ season, episode }),
      });
      if (!res.ok) throw new Error('Failed to update progress');
      const updated = await res.json();
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      return updated;
    } catch (err) {
      console.error(err);
    }
  };

  // Admin: Delete
  const handleDeleteItem = async (item: MediaItem): Promise<boolean> => {
    if (!token) return false;
    if (typeof window !== 'undefined' && !window.confirm(`Are you sure you want to remove "${item.title}" from your library?`)) {
      return false;
    }

    try {
      const res = await fetch(`/api/library/${item.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete title');
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Filter & Sort Logic
  const filteredAndSortedItems = useMemo(() => {
    return items
      .filter((item) => {
        if (selectedType !== 'all' && item.type !== selectedType) return false;
        if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchGenres = item.genres?.some((g) => g.toLowerCase().includes(q));
          const matchNotes = item.notes?.toLowerCase().includes(q);
          if (!matchTitle && !matchGenres && !matchNotes) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rating_high') {
          return (b.rating || 0) - (a.rating || 0);
        }
        if (sortBy === 'year_new') {
          return (b.releaseYear || 0) - (a.releaseYear || 0);
        }
        if (sortBy === 'title_asc') {
          return a.title.localeCompare(b.title);
        }
        const timeA = new Date(a.updatedAt || a.createdAt).getTime();
        const timeB = new Date(b.updatedAt || b.createdAt).getTime();
        return timeB - timeA;
      });
  }, [items, selectedType, selectedStatus, searchQuery, sortBy]);

  const movieCount = useMemo(() => items.filter((i) => i.type === 'movie').length, [items]);
  const seriesCount = useMemo(() => items.filter((i) => i.type === 'series').length, [items]);

  const currentlyWatchingSeries = useMemo(() => {
    return items.filter((i) => i.type === 'series' && i.status === 'watching');
  }, [items]);

  const totalPages = Math.ceil(filteredAndSortedItems.length / itemsPerPage) || 1;

  const displayedItems = useMemo(() => {
    if (viewMode === 'scroll') {
      return filteredAndSortedItems;
    } else {
      const start = (currentPage - 1) * itemsPerPage;
      return filteredAndSortedItems.slice(start, start + itemsPerPage);
    }
  }, [filteredAndSortedItems, viewMode, currentPage]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (typeof document !== 'undefined') {
      const gridEl = document.getElementById('movies-series-grid');
      if (gridEl) {
        gridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + itemsPerPage, filteredAndSortedItems.length));
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedStatus('all');
  };

  return {
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
  };
}
