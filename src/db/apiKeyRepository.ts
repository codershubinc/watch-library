import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { mongoClient, mongoDbConnected } from './client';
import { ApiKeyItem, GeneratedApiKey, ApiKeyScope } from '../models';

declare global {
  var _localApiKeys: ApiKeyItem[] | undefined;
}

export let localApiKeys: ApiKeyItem[] = global._localApiKeys || (global._localApiKeys = []);

export function setLocalApiKeys(newKeys: ApiKeyItem[]): void {
  localApiKeys = newKeys;
  global._localApiKeys = newKeys;
}

export const apiKeyRepository = {
  /**
   * Generates a new API Key with a cryptographically secure random token,
   * stores only its SHA-256 hash, and returns the full raw key once.
   */
  async createKey(name: string, scope: ApiKeyScope = 'full_access'): Promise<GeneratedApiKey> {
    const rawSecret = crypto.randomBytes(24).toString('hex');
    const rawKey = `wl_live_${rawSecret}`;
    const keyPrefix = `${rawKey.substring(0, 16)}...`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const createdAt = new Date().toISOString();

    const apiKeyData: ApiKeyItem = {
      id: crypto.randomUUID(),
      name: name.trim() || 'API Key',
      keyPrefix,
      keyHash,
      scope,
      createdAt,
    };

    if (mongoDbConnected && mongoClient) {
      const db = mongoClient.db();
      const result = await db.collection('api_keys').insertOne({
        ...apiKeyData,
        _id: new ObjectId() as any,
      });
      apiKeyData.id = result.insertedId.toString();
    } else {
      setLocalApiKeys([apiKeyData, ...localApiKeys]);
    }

    return {
      ...apiKeyData,
      rawKey,
    };
  },

  /**
   * Lists all generated API keys (safely omitting raw secrets)
   */
  async listKeys(): Promise<ApiKeyItem[]> {
    if (mongoDbConnected && mongoClient) {
      const db = mongoClient.db();
      const docs = await db
        .collection('api_keys')
        .find({})
        .sort({ createdAt: -1 })
        .toArray();
      return docs.map((doc: any) => ({
        id: doc._id ? doc._id.toString() : doc.id,
        name: doc.name,
        keyPrefix: doc.keyPrefix,
        keyHash: doc.keyHash,
        scope: doc.scope || 'full_access',
        createdAt: doc.createdAt,
        lastUsedAt: doc.lastUsedAt,
      }));
    } else {
      return localApiKeys;
    }
  },

  /**
   * Revokes / deletes an API key by ID
   */
  async revokeKey(id: string): Promise<boolean> {
    if (mongoDbConnected && mongoClient) {
      const db = mongoClient.db();
      let query: any = { id };
      if (ObjectId.isValid(id)) {
        query = { $or: [{ _id: new ObjectId(id) }, { id }] };
      }
      const res = await db.collection('api_keys').deleteOne(query);
      return res.deletedCount > 0;
    } else {
      const initial = localApiKeys.length;
      setLocalApiKeys(localApiKeys.filter((k) => k.id !== id));
      return localApiKeys.length < initial;
    }
  },

  /**
   * Validates a raw Bearer token against stored API key hashes.
   * If valid, updates lastUsedAt asynchronously.
   */
  async validateKey(rawKey: string): Promise<boolean> {
    if (!rawKey || !rawKey.startsWith('wl_live_')) {
      return false;
    }

    const providedHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const now = new Date().toISOString();

    if (mongoDbConnected && mongoClient) {
      const db = mongoClient.db();
      const found = await db.collection('api_keys').findOne({ keyHash: providedHash });
      if (found) {
        // Update lastUsedAt asynchronously in the background
        db.collection('api_keys')
          .updateOne({ _id: found._id }, { $set: { lastUsedAt: now } })
          .catch((err) => console.warn('Could not update key lastUsedAt:', err));
        return true;
      }
      return false;
    } else {
      const foundIndex = localApiKeys.findIndex((k) => {
        // Timing-safe hash comparison
        try {
          const a = Buffer.from(k.keyHash, 'hex');
          const b = Buffer.from(providedHash, 'hex');
          return a.length === b.length && crypto.timingSafeEqual(a, b);
        } catch {
          return false;
        }
      });

      if (foundIndex !== -1) {
        localApiKeys[foundIndex].lastUsedAt = now;
        return true;
      }
      return false;
    }
  },
};
