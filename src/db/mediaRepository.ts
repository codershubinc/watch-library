import { ObjectId } from 'mongodb';
import { mongoClient, mongoDbConnected } from './client';
import { localStore, setLocalStore } from './memoryStore';
import { MediaItem, MovieItem, SeriesItem, WatchStatus } from '../models';

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

      const setObj: any = { progress: newProgress, updatedAt };
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
};
