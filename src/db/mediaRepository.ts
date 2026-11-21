import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { mongoClient, mongoDbConnected } from './client';
import { localStore, setLocalStore } from './memoryStore';
import { MediaItem, MovieItem, SeriesItem, WatchStatus, LibraryStats } from '../models';

export const mediaRepository = {
  // General find (both movies and series)
  async findItems(skip = 0, limit = 25): Promise<{ items: MediaItem[]; total: number }> {
    if (mongoDbConnected && mongoClient) {
      const db = mongoClient.db();
      const docs = await db
        .collection('media_items')
        .find({})
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
      const items: MediaItem[] = docs.map((doc: any) => ({
        ...doc,
        id: doc._id ? doc._id.toString() : doc.id,
      }));
      const total = await db.collection('media_items').countDocuments({});
      return { items, total };
    } else {
      const sliced = localStore.slice(skip, skip + limit);
      return { items: sliced, total: localStore.length };
    }
  },

  // Specialized find for Movies
  async findMovies(skip = 0, limit = 25): Promise<{ movies: MovieItem[]; total: number }> {
    if (mongoDbConnected && mongoClient) {
      const db = mongoClient.db();
      const docs = await db
        .collection('media_items')
        .find({ type: 'movie' })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
      const movies: MovieItem[] = docs.map((doc: any) => ({
        ...doc,
        id: doc._id ? doc._id.toString() : doc.id,
      }));
      const total = await db.collection('media_items').countDocuments({ type: 'movie' });
      return { movies, total };
    } else {
      const filtered = localStore.filter((i) => i.type === 'movie') as MovieItem[];
      return { movies: filtered.slice(skip, skip + limit), total: filtered.length };
    }
  },

  // Specialized find for Series
  async findSeries(skip = 0, limit = 25): Promise<{ series: SeriesItem[]; total: number }> {
    if (mongoDbConnected && mongoClient) {
      const db = mongoClient.db();
      const docs = await db
        .collection('media_items')
        .find({ type: 'series' })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
      const series: SeriesItem[] = docs.map((doc: any) => ({
        ...doc,
        id: doc._id ? doc._id.toString() : doc.id,
      }));
      const total = await db.collection('media_items').countDocuments({ type: 'series' });
      return { series, total };
    } else {
      const filtered = localStore.filter((i) => i.type === 'series') as SeriesItem[];
      return { series: filtered.slice(skip, skip + limit), total: filtered.length };
    }
  },

  async findByImdbId(imdbId: string): Promise<MediaItem | null> {
    if (mongoDbConnected && mongoClient) {
      const db = mongoClient.db();
      const doc = await db.collection('media_items').findOne({ imdbId });
      if (!doc) return null;
      return { ...doc, id: doc._id ? doc._id.toString() : doc.id } as unknown as MediaItem;
    } else {
      const found = localStore.find((i) => i.imdbId === imdbId);
      return found || null;
    }
  },

  async findByTitle(title: string): Promise<MediaItem | null> {
    const cleanTitle = title.trim();
    if (!cleanTitle) return null;

    if (mongoDbConnected && mongoClient) {
      const db = mongoClient.db();
      const escaped = cleanTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const doc = await db.collection('media_items').findOne({
        title: { $regex: new RegExp(`^${escaped}$`, 'i') },
      });
      if (!doc) return null;
      return { ...doc, id: doc._id ? doc._id.toString() : doc.id } as unknown as MediaItem;
    } else {
      const lower = cleanTitle.toLowerCase();
      const found = localStore.find((i) => i.title?.toLowerCase() === lower);
      return found || null;
    }
  },

  async findLastSeen(type?: 'movie' | 'series', status?: string): Promise<MediaItem | null> {
    if (mongoDbConnected && mongoClient) {
      const db = mongoClient.db();
      const filter: any = {};
      if (type) filter.type = type;

      // Status check: Only include watched / currently watching titles ('completed' or 'watching')
      // Excludes 'plan_to_watch' (watchlist) and 'dropped'
      if (status) {
        filter.status = status;
      } else {
        filter.status = { $in: ['completed', 'watching'] };
      }

      // Sort strictly by lastSeen descending, falling back to createdAt descending.
      // (NEVER by updatedAt, so that editing reviews or notes does NOT falsely make a movie appear as recently seen)
      const docs = await db
        .collection('media_items')
        .find(filter)
        .sort({ lastSeen: -1, createdAt: -1 })
        .limit(1)
        .toArray();
      if (!docs || docs.length === 0) return null;
      return { ...docs[0], id: docs[0]._id ? docs[0]._id.toString() : docs[0].id } as unknown as MediaItem;
    } else {
      let filtered = localStore;
      if (type) filtered = filtered.filter((i) => i.type === type);

      // Status check: Exclude plan_to_watch / un-watched items
      if (status) {
        filtered = filtered.filter((i) => i.status === status);
      } else {
        filtered = filtered.filter((i) => i.status === 'completed' || i.status === 'watching');
      }

      if (filtered.length === 0) return null;
      const sorted = [...filtered].sort((a, b) => {
        const timeA = new Date(a.lastSeen || a.createdAt).getTime();
        const timeB = new Date(b.lastSeen || b.createdAt).getTime();
        return timeB - timeA;
      });
      return sorted[0] || null;
    }
  },

  async findItemById(id: string): Promise<MediaItem | null> {
    if (mongoDbConnected && mongoClient) {
      const db = mongoClient.db();
      let query: any = { id };
      if (ObjectId.isValid(id)) {
        query = { $or: [{ _id: new ObjectId(id) }, { id }] };
      }
      const doc = await db.collection('media_items').findOne(query);
      if (!doc) return null;
      return { ...doc, id: doc._id ? doc._id.toString() : doc.id } as unknown as MediaItem;
    } else {
      const found = localStore.find((i) => i.id === id);
      return found || null;
    }
  },

  async findMovieById(id: string): Promise<MovieItem | null> {
    if (mongoDbConnected && mongoClient) {
      const db = mongoClient.db();
      let query: any = { id, type: 'movie' };
      if (ObjectId.isValid(id)) {
        query = { $or: [{ _id: new ObjectId(id), type: 'movie' }, { id, type: 'movie' }] };
      }
      const doc = await db.collection('media_items').findOne(query);
      if (!doc) return null;
      return { ...doc, id: doc._id ? doc._id.toString() : doc.id } as unknown as MovieItem;
    } else {
      const found = localStore.find((i) => i.id === id && i.type === 'movie');
      return (found as MovieItem) || null;
    }
  },

  async findSeriesById(id: string): Promise<SeriesItem | null> {
    if (mongoDbConnected && mongoClient) {
      const db = mongoClient.db();
      let query: any = { id, type: 'series' };
      if (ObjectId.isValid(id)) {
        query = { $or: [{ _id: new ObjectId(id), type: 'series' }, { id, type: 'series' }] };
      }
      const doc = await db.collection('media_items').findOne(query);
      if (!doc) return null;
      return { ...doc, id: doc._id ? doc._id.toString() : doc.id } as unknown as SeriesItem;
    } else {
      const found = localStore.find((i) => i.id === id && i.type === 'series');
      return (found as SeriesItem) || null;
    }
  },

  async createItem(item: MediaItem): Promise<MediaItem> {
    if (mongoDbConnected && mongoClient) {
      const db = mongoClient.db();
      const result = await db.collection('media_items').insertOne({ ...item, _id: new ObjectId() as any });
      return { ...item, id: result.insertedId.toString() };
    } else {
      setLocalStore([item, ...localStore]);
      return item;
    }
  },

  async updateItem(id: string, updates: Partial<MediaItem>): Promise<MediaItem | null> {
    const updatedAt = new Date().toISOString();
    const updatedData = { ...updates, updatedAt };

    if (mongoDbConnected && mongoClient) {
      const db = mongoClient.db();
      let query: any = { id };
      if (ObjectId.isValid(id)) {
        query = { $or: [{ _id: new ObjectId(id) }, { id }] };
      }
      await db.collection('media_items').updateOne(query, { $set: updatedData });
      const doc = await db.collection('media_items').findOne(query);
      if (!doc) return null;
      return { ...doc, id: doc._id ? doc._id.toString() : id } as unknown as MediaItem;
    } else {
      const index = localStore.findIndex((i) => i.id === id);
      if (index === -1) return null;
      const newStore = [...localStore];
      newStore[index] = { ...newStore[index], ...updatedData };
      setLocalStore(newStore);
      return newStore[index];
    }
  },

  async updateProgress(
    id: string,
    season?: number,
    episode?: number,
    status?: string
  ): Promise<MediaItem | null> {
    const updatedAt = new Date().toISOString();

    if (mongoDbConnected && mongoClient) {
      const db = mongoClient.db();
      let query: any = { id };
      if (ObjectId.isValid(id)) {
        query = { $or: [{ _id: new ObjectId(id) }, { id }] };
      }
      const item: any = await db.collection('media_items').findOne(query);
      if (!item) return null;

      const newProgress = {
        ...(item.progress || { season: 1, episode: 1 }),
        ...(season !== undefined && !isNaN(season) ? { season } : {}),
        ...(episode !== undefined && !isNaN(episode) ? { episode } : {}),
      };

      const setObj: any = { progress: newProgress, lastSeen: updatedAt, updatedAt };
      if (status && ['watching', 'completed', 'plan_to_watch', 'dropped'].includes(status)) {
        setObj.status = status;
      }

      await db.collection('media_items').updateOne(query, { $set: setObj });
      const updated = await db.collection('media_items').findOne(query);
      if (!updated) return null;
      return { ...updated, id: updated._id ? updated._id.toString() : id } as unknown as MediaItem;
    } else {
      const index = localStore.findIndex((i) => i.id === id);
      if (index === -1) return null;

      const item = localStore[index];
      const newProgress = {
        ...(item.progress || { season: 1, episode: 1 }),
        ...(season !== undefined && !isNaN(season) ? { season } : {}),
        ...(episode !== undefined && !isNaN(episode) ? { episode } : {}),
      };

      const validStatus = status && ['watching', 'completed', 'plan_to_watch', 'dropped'].includes(status)
        ? (status as WatchStatus)
        : item.status;

      const newStore = [...localStore];
      newStore[index] = {
        ...item,
        progress: newProgress,
        status: validStatus,
        lastSeen: updatedAt,
        updatedAt,
      };
      setLocalStore(newStore);
      return newStore[index];
    }
  },

  async deleteItem(id: string): Promise<boolean> {
    if (mongoDbConnected && mongoClient) {
      const db = mongoClient.db();
      let query: any = { id };
      if (ObjectId.isValid(id)) {
        query = { $or: [{ _id: new ObjectId(id) }, { id }] };
      }
      const result = await db.collection('media_items').deleteOne(query);
      return result.deletedCount > 0;
    } else {
      const initialLen = localStore.length;
      setLocalStore(localStore.filter((i) => i.id !== id));
      return localStore.length < initialLen;
    }
  },

  async getStats(): Promise<LibraryStats> {
    const allItems: MediaItem[] = mongoDbConnected && mongoClient
      ? (await mongoClient.db().collection('media_items').find({}).toArray()).map((d: any) => ({
          ...d,
          id: d._id ? d._id.toString() : d.id,
        }))
      : localStore;

    let moviesCount = 0;
    let seriesCount = 0;
    const statusBreakdown = {
      watching: 0,
      completed: 0,
      plan_to_watch: 0,
      on_hold: 0,
      dropped: 0,
    };
    const genreMap: Record<string, number> = {};
    let ratingSum = 0;
    let ratingCount = 0;
    let totalMovieDurationMinutes = 0;
    let totalEpisodesWatched = 0;

    for (const item of allItems) {
      if (item.type === 'movie') {
        moviesCount++;
        if (typeof item.durationMinutes === 'number' && !isNaN(item.durationMinutes)) {
          totalMovieDurationMinutes += item.durationMinutes;
        }
      } else if (item.type === 'series') {
        seriesCount++;
        if (item.progress && typeof item.progress.episode === 'number' && !isNaN(item.progress.episode)) {
          totalEpisodesWatched += item.progress.episode;
        }
      }

      if (item.status && statusBreakdown[item.status] !== undefined) {
        statusBreakdown[item.status]++;
      }

      if (typeof item.rating === 'number' && !isNaN(item.rating)) {
        ratingSum += item.rating;
        ratingCount++;
      }

      if (Array.isArray(item.genres)) {
        for (const g of item.genres) {
          if (g && typeof g === 'string') {
            const clean = g.trim();
            if (clean) genreMap[clean] = (genreMap[clean] || 0) + 1;
          }
        }
      }
    }

    const topGenres = Object.entries(genreMap)
      .map(([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const averageRating = ratingCount > 0 ? Number((ratingSum / ratingCount).toFixed(2)) : null;

    return {
      totalCount: allItems.length,
      moviesCount,
      seriesCount,
      statusBreakdown,
      topGenres,
      averageRating,
      totalMovieDurationMinutes,
      totalEpisodesWatched,
    };
  },

  async search(query: string, limit = 20): Promise<MediaItem[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const allItems: MediaItem[] = mongoDbConnected && mongoClient
      ? (await mongoClient.db().collection('media_items').find({}).toArray()).map((d: any) => ({
          ...d,
          id: d._id ? d._id.toString() : d.id,
        }))
      : localStore;

    const matches = allItems.filter((item) => {
      if (item.title?.toLowerCase().includes(q)) return true;
      if (item.director?.toLowerCase().includes(q)) return true;
      if (item.network?.toLowerCase().includes(q)) return true;
      if (item.imdbId?.toLowerCase().includes(q)) return true;
      if (item.genres?.some((g) => g.toLowerCase().includes(q))) return true;
      if (item.plot?.toLowerCase().includes(q)) return true;
      return false;
    });

    return matches.slice(0, limit);
  },

  async getRandom(filter?: { type?: string; status?: string; genre?: string }): Promise<MediaItem | null> {
    const allItems: MediaItem[] = mongoDbConnected && mongoClient
      ? (await mongoClient.db().collection('media_items').find({}).toArray()).map((d: any) => ({
          ...d,
          id: d._id ? d._id.toString() : d.id,
        }))
      : localStore;

    let pool = allItems;
    if (filter?.type && filter.type !== 'all') {
      pool = pool.filter((i) => i.type === filter.type);
    }
    if (filter?.status && filter.status !== 'all') {
      pool = pool.filter((i) => i.status === filter.status);
    }
    if (filter?.genre) {
      const gLower = filter.genre.toLowerCase();
      pool = pool.filter((i) => i.genres?.some((g) => g.toLowerCase() === gLower));
    }

    if (pool.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex] || null;
  },

  async batchImport(
    rawItems: any[],
    onDuplicate: 'skip' | 'update' = 'skip'
  ): Promise<{ added: number; updated: number; skipped: number; totalProcessed: number }> {
    let added = 0;
    let updated = 0;
    let skipped = 0;

    for (const raw of rawItems) {
      const imdbId = raw?.imdbId ? String(raw.imdbId).trim() : null;
      if (!raw || typeof raw !== 'object' || !raw.title || !imdbId) {
        skipped++;
        continue;
      }

      let existing: MediaItem | null = await this.findByImdbId(imdbId);

      if (existing) {
        if (onDuplicate === 'update') {
          await this.updateItem(existing.id, raw);
          updated++;
        } else {
          skipped++;
        }
      } else {
        const type = raw.type === 'series' ? 'series' : 'movie';
        const newItem: MediaItem = {
          id: crypto.randomUUID(),
          title: String(raw.title).trim(),
          type,
          imdbId,
          posterUrl: raw.posterUrl,
          backdropUrl: raw.backdropUrl,
          releaseYear: raw.releaseYear ? Number(raw.releaseYear) : undefined,
          status: raw.status || 'watching',
          rating: raw.rating != null && !isNaN(Number(raw.rating)) ? Number(raw.rating) : undefined,
          genres: Array.isArray(raw.genres) ? raw.genres : [],
          plot: raw.plot,
          notes: raw.notes,
          durationMinutes: raw.durationMinutes ? Number(raw.durationMinutes) : undefined,
          director: raw.director,
          totalSeasons: raw.totalSeasons ? Number(raw.totalSeasons) : undefined,
          totalEpisodes: raw.totalEpisodes ? Number(raw.totalEpisodes) : undefined,
          network: raw.network,
          airingStatus: raw.airingStatus,
          progress: raw.progress,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await this.createItem(newItem);
        added++;
      }
    }

    return { added, updated, skipped, totalProcessed: rawItems.length };
  },

  async exportAll(): Promise<MediaItem[]> {
    if (mongoDbConnected && mongoClient) {
      const db = mongoClient.db();
      const docs = await db.collection('media_items').find({}).sort({ updatedAt: -1 }).toArray();
      return docs.map((doc: any) => ({
        ...doc,
        id: doc._id ? doc._id.toString() : doc.id,
      }));
    } else {
      return [...localStore];
    }
  },
};
