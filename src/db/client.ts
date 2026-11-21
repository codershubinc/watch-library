import { MongoClient } from 'mongodb';

declare global {
  var _mongoClient: MongoClient | null | undefined;
  var _mongoDbConnected: boolean | undefined;
  var _mongoConnectionError: string | undefined;
}

export let mongoClient: MongoClient | null = global._mongoClient ?? null;
export let mongoDbConnected = global._mongoDbConnected ?? false;
export let mongoConnectionError = global._mongoConnectionError ?? '';

export async function initMongo(): Promise<MongoClient | null> {
  if (global._mongoClient && global._mongoDbConnected) {
    mongoClient = global._mongoClient;
    mongoDbConnected = true;
    return mongoClient;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri || uri.trim() === '') {
    return null;
  }

  try {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    await client.connect();
    mongoClient = client;
    mongoDbConnected = true;
    mongoConnectionError = '';

    global._mongoClient = client;
    global._mongoDbConnected = true;
    global._mongoConnectionError = '';
    console.log('[DB] Successfully connected to MongoDB Atlas!');
    return client;
  } catch (err: any) {
    mongoDbConnected = false;
    mongoConnectionError = err?.message || 'Failed to connect to MongoDB';
    global._mongoDbConnected = false;
    global._mongoConnectionError = mongoConnectionError;
    console.error('[DB] MongoDB connection warning:', mongoConnectionError);
    return null;
  }
}
