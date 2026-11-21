import React, { useState, useEffect } from 'react';
import { X, Film, Tv, Image, Star, Tag, Calendar, CheckCircle2, Bookmark, Clock, PauseCircle, Search } from 'lucide-react';
import { MediaItem, MediaType, WatchStatus } from '../types';

interface AddEditMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: Partial<MediaItem>) => Promise<void>;
  initialData?: MediaItem | null;
}

const SAMPLE_POSTERS = [
  { label: 'Sci-Fi Neon', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=800&auto=format&fit=crop' },
  { label: 'Desert Epic', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop' },
  { label: 'Dark City', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop' },
  { label: 'Cyberpunk', url: 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=800&auto=format&fit=crop' },
  { label: 'Cinema Hall', url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800&auto=format&fit=crop' },
  { label: 'Kitchen Heat', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800&auto=format&fit=crop' },
];

const COMMON_GENRES = [
  'Sci-Fi', 'Action', 'Drama', 'Thriller', 'Animation', 'Comedy', 
  'Crime', 'Adventure', 'Mystery', 'Fantasy', 'Horror', 'Romance'
];

export const AddEditMediaModal: React.FC<AddEditMediaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [type, setType] = useState<MediaType>('series');
  const [title, setTitle] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [releaseYear, setReleaseYear] = useState<string>('');
  const [status, setStatus] = useState<WatchStatus>('watching');
  const [season, setSeason] = useState<number>(1);
  const [episode, setEpisode] = useState<number>(1);
  const [totalEpisodes, setTotalEpisodes] = useState<string>('');
  const [totalSeasons, setTotalSeasons] = useState<string>('');
  const [rating, setRating] = useState<number>(8.5);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [plot, setPlot] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFetchingOmdb, setIsFetchingOmdb] = useState(false);

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setTitle(initialData.title);
      setPosterUrl(initialData.posterUrl || '');
      setReleaseYear(initialData.releaseYear ? initialData.releaseYear.toString() : '');
      setStatus(initialData.status);
      setSeason(initialData.progress?.season || 1);
      setEpisode(initialData.progress?.episode || 1);
      setTotalEpisodes(initialData.progress?.totalEpisodes ? initialData.progress.totalEpisodes.toString() : '');
      setRating(initialData.rating || 8.0);
      setSelectedGenres(initialData.genres || []);
      setPlot(initialData.plot || '');
      setNotes(initialData.notes || '');
    } else {
      // Reset defaults
      setType('series');
      setTitle('');
      setPosterUrl('');
      setReleaseYear(new Date().getFullYear().toString());
      setStatus('watching');
      setSeason(1);
      setEpisode(1);
      setTotalEpisodes('');
      setRating(8.5);
      setSelectedGenres(['Drama']);
      setPlot('');
      setNotes('');
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: Partial<MediaItem> = {
        title: title.trim(),
        type,
        posterUrl: posterUrl.trim() || undefined,
        releaseYear: releaseYear ? parseInt(releaseYear, 10) : undefined,
        status,
        rating: Number(rating),
        genres: selectedGenres,
        plot: plot.trim() || undefined,
        notes: notes.trim() || undefined,
        ...(type === 'series'
          ? {
              progress: {
                season: Number(season) || 1,
                episode: Number(episode) || 1,
                totalEpisodes: totalEpisodes ? parseInt(totalEpisodes, 10) : undefined,
              },
            }
          : { progress: undefined }),
      };

      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save title');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOmdbFetch = async () => {
    if (!title.trim()) {
      setError('Please enter a title to search first.');
      return;
    }
    setIsFetchingOmdb(true);
    setError(null);
    try {
      const token = localStorage.getItem('watch_lib_admin_token');
      const res = await fetch(`/api/omdb?t=${encodeURIComponent(title.trim())}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch from OMDB');
      
      if (data.Title) setTitle(data.Title);
      if (data.Poster && data.Poster !== 'N/A') setPosterUrl(data.Poster);
      if (data.Year) setReleaseYear(data.Year.replace(/[^0-9]/g, '').substring(0, 4));
      if (data.imdbRating && data.imdbRating !== 'N/A') setRating(parseFloat(data.imdbRating));
      if (data.Plot && data.Plot !== 'N/A') setPlot(data.Plot);
      if (data.Genre && data.Genre !== 'N/A') {
        const genres = data.Genre.split(',').map((g: string) => g.trim());
        setSelectedGenres((prev) => Array.from(new Set([...prev, ...genres])));
      }
      if (data.Type) {
        setType(data.Type === 'series' ? 'series' : 'movie');
      }
      if (data.Type === 'series' && data.totalSeasons && data.totalSeasons !== 'N/A') {
        setTotalSeasons(data.totalSeasons);
        try {
          const fetchIdOrTitle = data.imdbID ? data.imdbID : (data.Title || title.trim());
          const sRes = await fetch(`/api/omdb?t=${encodeURIComponent(fetchIdOrTitle)}&Season=${data.totalSeasons}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const sData = await sRes.json();
          if (sData.Episodes && Array.isArray(sData.Episodes)) {
            setTotalEpisodes(sData.Episodes.length.toString());
          }
        } catch (e) {
          console.error('Failed to fetch season data', e);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Error fetching from OMDB');
    } finally {
      setIsFetchingOmdb(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div 
        id="add-edit-media-modal" 
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/80 my-8 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div>
            <h2 className="text-lg font-bold text-white">
              {initialData ? 'Edit Media Entry' : 'Add to Watch Library'}
            </h2>
            <p className="text-xs text-slate-400">
              {initialData ? 'Update your watching record or progress' : 'Catalog a new movie or TV series you are watching'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs">
            {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* 1. Media Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Category
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('series')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition ${
                  type === 'series'
                    ? 'bg-orange-500/15 border-orange-500 text-orange-300 shadow-sm shadow-orange-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Tv className="w-4 h-4 text-orange-400" />
                <span>TV Series (With Episode Progress)</span>
              </button>

              <button
                type="button"
                onClick={() => setType('movie')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition ${
                  type === 'movie'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-sm shadow-amber-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Film className="w-4 h-4 text-amber-400" />
                <span>Movie</span>
              </button>
            </div>
          </div>

          {/* 2. Title & Year */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Title *
                </label>
                <button
                  type="button"
                  onClick={handleOmdbFetch}
                  disabled={isFetchingOmdb || !title.trim()}
                  className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 disabled:opacity-50 transition"
                  title="Auto-fill details from OMDB"
                >
                  <Search className="w-3.5 h-3.5" />
                  {isFetchingOmdb ? 'Searching...' : 'Search OMDB'}
                </button>
              </div>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Inception, or IMDb ID (tt1375666)"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Tip: Paste an IMDb ID (like tt1234567) and click Search OMDB to ensure exact matches.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Release Year
              </label>
              <input
                type="number"
                value={releaseYear}
                onChange={(e) => setReleaseYear(e.target.value)}
                placeholder="2024"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* 3. Watch Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Watching Status
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'watching', label: 'Currently Watching', icon: Clock, color: 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10' },
                { id: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-indigo-400 border-indigo-500/50 bg-indigo-500/10' },
                { id: 'plan_to_watch', label: 'Plan to Watch', icon: Bookmark, color: 'text-amber-400 border-amber-500/50 bg-amber-500/10' },
                { id: 'on_hold', label: 'On Hold', icon: PauseCircle, color: 'text-slate-400 border-slate-600 bg-slate-800/40' },
              ].map((st) => {
                const Icon = st.icon;
                const isSelected = status === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setStatus(st.id as WatchStatus);
                      if (st.id === 'completed' && type === 'series') {
                        if (totalSeasons) setSeason(parseInt(totalSeasons, 10) || 1);
                        if (totalEpisodes) setEpisode(parseInt(totalEpisodes, 10) || 1);
                      }
                    }}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition ${
                      isSelected
                        ? st.color
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{st.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. SPECIFIC TO SERIES: Progress (S1 E2) */}
          {type === 'series' && (
            <div className="p-4 bg-orange-950/20 rounded-xl border border-orange-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tv className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-300">
                    Series Watching Progress (e.g. S1 E2)
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-orange-400 bg-orange-900/40 px-2.5 py-0.5 rounded-full border border-orange-700/50">
                  S{season} · E{episode}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Current Season
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 text-xs font-bold">S</span>
                    <input
                      type="number"
                      min="1"
                      required
                      value={season}
                      onChange={(e) => setSeason(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Current Episode
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 text-xs font-bold">E</span>
                    <input
                      type="number"
                      min="1"
                      required
                      value={episode}
                      onChange={(e) => setEpisode(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Total Ep in Season (opt)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 10"
                    value={totalEpisodes}
                    onChange={(e) => setTotalEpisodes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 5. Rating */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                Personal Rating: <span className="text-amber-400 font-bold ml-1">{rating.toFixed(1)} / 10</span>
              </label>
              <span className="text-xs text-slate-500">Slide to rate</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="0.1"
              value={rating}
              onChange={(e) => setRating(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
          </div>

          {/* 6. Poster URL & Sample Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5 text-slate-400" />
              Poster Image URL
            </label>
            <div className="flex gap-4">
              {posterUrl && (
                <div className="w-16 h-24 shrink-0 rounded-lg overflow-hidden bg-slate-950 border border-slate-800">
                  <img src={posterUrl} alt="Poster preview" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1">
                <input
                  type="url"
                  value={posterUrl}
                  onChange={(e) => setPosterUrl(e.target.value)}
                  placeholder="https://... (or choose a preset below)"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 mb-2"
                />
              </div>
            </div>
            {/* Presets */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500">Quick presets:</span>
              {SAMPLE_POSTERS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setPosterUrl(p.url)}
                  className="text-xs px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* 7. Genres */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              Genres & Tags
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_GENRES.map((g) => {
                const isSelected = selectedGenres.includes(g);
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGenre(g)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {isSelected ? `✓ ${g}` : `+ ${g}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 8. Plot Summary */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Plot Summary
            </label>
            <textarea
              value={plot}
              onChange={(e) => setPlot(e.target.value)}
              placeholder="Brief description of the story..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 min-h-[80px]"
            />
          </div>

          {/* 9. Notes / Review */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Personal Review / Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you think? Favorite scene, character, plot twist..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 rounded-xl transition shadow-md shadow-amber-500/20"
            >
              {isSubmitting ? 'Saving...' : initialData ? 'Update Title' : 'Add to Library'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
