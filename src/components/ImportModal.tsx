import React, { useState, useRef } from 'react';
import { X, UploadCloud, AlertCircle, CheckCircle2, PlayCircle, Loader2 } from 'lucide-react';
import { extractTitlesFromCsv } from '../csvParser';
import { MediaItem } from '../types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImportComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedTitles, setParsedTitles] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, successes: 0, failures: 0 });
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setError(null);
    setParsedTitles([]);

    try {
      const text = await selected.text();
      if (selected.name.endsWith('.json')) {
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
          const titles = data.map(d => d.title || d.name).filter(Boolean);
          setParsedTitles(titles);
        } else {
          setError('JSON must be an array of objects with a "title" field.');
        }
      } else {
        const titles = extractTitlesFromCsv(text);
        setParsedTitles(titles);
      }
    } catch (err) {
      setError('Failed to parse file. Make sure it is a valid CSV or JSON export.');
    }
  };

  const startImport = async () => {
    if (parsedTitles.length === 0) return;
    setIsImporting(true);
    setProgress({ current: 0, total: parsedTitles.length, successes: 0, failures: 0 });
    const token = localStorage.getItem('watch_lib_admin_token');

    let successes = 0;
    let failures = 0;

    for (let i = 0; i < parsedTitles.length; i++) {
      const title = parsedTitles[i];
      setProgress(p => ({ ...p, current: i + 1 }));

      try {
        // 1. Fetch OMDB
        const omdbRes = await fetch(`/api/omdb?t=${encodeURIComponent(title)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await omdbRes.json();

        // If not found or error, we still try to add it with basic info
        const isFound = omdbRes.ok && data.Response !== 'False';

        const payload = {
          title: isFound ? data.Title : title,
          type: isFound && data.Type === 'series' ? 'series' : 'movie',
          posterUrl: isFound && data.Poster !== 'N/A' ? data.Poster : undefined,
          releaseYear: isFound && data.Year ? parseInt(data.Year.replace(/[^0-9]/g, '').substring(0, 4)) : undefined,
          rating: isFound && data.imdbRating !== 'N/A' ? parseFloat(data.imdbRating) : undefined,
          genres: isFound && data.Genre !== 'N/A' ? data.Genre.split(',').map((g: string) => g.trim()) : [],
          plot: isFound && data.Plot !== 'N/A' ? data.Plot : undefined,
          status: 'completed', // Default imported items to completed
          progress: isFound && data.Type === 'series' && data.totalSeasons !== 'N/A' ? {
            season: parseInt(data.totalSeasons) || 1,
            episode: 1, // Without full season fetch, just default episode 1
          } : undefined
        };

        // 2. Post to Library
        const libRes = await fetch('/api/library', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (libRes.ok) {
          successes++;
        } else {
          failures++;
        }
      } catch (err) {
        failures++;
      }
      
      setProgress(p => ({ ...p, successes, failures }));
      
      // Small delay to prevent hammering the server/OMDB too fast
      await new Promise(r => setTimeout(r, 250));
    }

    setIsImporting(false);
    onImportComplete();
  };

  const handleClose = () => {
    if (isImporting) return;
    setFile(null);
    setParsedTitles([]);
    setProgress({ current: 0, total: 0, successes: 0, failures: 0 });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
        {!isImporting && (
          <button onClick={handleClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <UploadCloud className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">Bulk Import</h2>
          </div>

          {!isImporting && progress.total === 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-300">
                Upload a CSV export from IMDb, Letterboxd, Netflix, or Trakt. We will extract the titles, fetch their posters from OMDB, and add them to your library.
              </p>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition bg-slate-950/50"
              >
                <UploadCloud className="w-8 h-8 text-slate-500 mb-2" />
                <span className="text-sm font-semibold text-slate-300">Click to select CSV/JSON</span>
                <span className="text-xs text-slate-500 mt-1">{file ? file.name : 'No file selected'}</span>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".csv,.json" 
                  className="hidden" 
                />
              </div>

              {error && (
                <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-lg flex items-start gap-2 text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {parsedTitles.length > 0 && (
                <div className="p-4 bg-indigo-950/30 border border-indigo-900/50 rounded-xl">
                  <div className="flex items-center gap-2 text-indigo-300 mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-semibold text-sm">Found {parsedTitles.length} titles</span>
                  </div>
                  <div className="max-h-24 overflow-y-auto text-xs text-slate-400 space-y-1 mb-4 pr-2 custom-scrollbar">
                    {parsedTitles.slice(0, 10).map((t, i) => (
                      <div key={i} className="truncate">{t}</div>
                    ))}
                    {parsedTitles.length > 10 && (
                      <div className="text-indigo-400/70 italic">...and {parsedTitles.length - 10} more</div>
                    )}
                  </div>
                  <button
                    onClick={startImport}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
                  >
                    <PlayCircle className="w-4 h-4" />
                    Start Import
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 py-4">
              <div className="text-center space-y-2">
                {isImporting ? (
                  <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
                ) : (
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                )}
                
                <h3 className="text-lg font-bold text-white">
                  {isImporting ? 'Importing your library...' : 'Import Complete!'}
                </h3>
                <p className="text-sm text-slate-400">
                  {isImporting 
                    ? `Processing ${progress.current} of ${progress.total}` 
                    : `Successfully added ${progress.successes} titles.`}
                </p>
              </div>

              <div className="space-y-2">
                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${isImporting ? 'bg-indigo-500' : 'bg-emerald-500'}`}
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-emerald-400">{progress.successes} Success</span>
                  {progress.failures > 0 && <span className="text-red-400">{progress.failures} Failed</span>}
                </div>
              </div>

              {!isImporting && (
                <button
                  onClick={handleClose}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition mt-4"
                >
                  Close & View Library
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
