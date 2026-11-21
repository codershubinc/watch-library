import crypto from 'crypto';
import { mongoClient, mongoDbConnected, initMongo } from './client';

export interface AdminAuthDoc {
  _id?: any;
  username?: string;
  role?: string;
  password?: string;
  passwordHash?: string;
  passHash?: string;
  pass_hash?: string;
  password_hash?: string;
  hash?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface VerifyAuthResult {
  valid: boolean;
  error?: string;
}

/**
 * Safely compares two hex strings in constant time to prevent timing attacks.
 */
function safeCompareHex(hexA: string, hexB: string): boolean {
  try {
    const bufA = Buffer.from(hexA.trim().toLowerCase(), 'hex');
    const bufB = Buffer.from(hexB.trim().toLowerCase(), 'hex');
    if (bufA.length === 0 || bufB.length === 0 || bufA.length !== bufB.length) {
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export const authRepository = {
  /**
   * Verifies the provided password against password hashes stored in MongoDB.
   * Checks the 'admin_auth' collection (with fallback to 'auth').
   * Fully supports SHA-256 (64-char), SHA-512 (128-char), SHA-384, SHA-1, MD5, and plain-text.
   * All comparisons are timing-safe using crypto.timingSafeEqual.
   */
  async verifyPassword(provided: string): Promise<VerifyAuthResult> {
    if (!provided || typeof provided !== 'string') {
      return { valid: false, error: 'Password is required' };
    }

    // Ensure MongoDB connection is initialized
    await initMongo();

    if (!mongoDbConnected || !mongoClient) {
      return {
        valid: false,
        error: 'Database connection unavailable. MongoDB is not connected.',
      };
    }

    try {
      const db = mongoClient.db();

      // Query admin credentials from 'admin_auth' (or 'auth')
      let docs = await db.collection<AdminAuthDoc>('admin_auth').find({}).toArray();
      if (!docs || docs.length === 0) {
        docs = await db.collection<AdminAuthDoc>('auth').find({}).toArray();
      }

      if (!docs || docs.length === 0) {
        return {
          valid: false,
          error: "No admin credentials found in MongoDB 'admin_auth' collection. Please create an admin document in the database.",
        };
      }

      // Pre-compute candidate hashes for the provided password
      const sha256Hex = crypto.createHash('sha256').update(provided).digest('hex').toLowerCase();
      const sha512Hex = crypto.createHash('sha512').update(provided).digest('hex').toLowerCase();
      const sha384Hex = crypto.createHash('sha384').update(provided).digest('hex').toLowerCase();
      const sha1Hex = crypto.createHash('sha1').update(provided).digest('hex').toLowerCase();
      const md5Hex = crypto.createHash('md5').update(provided).digest('hex').toLowerCase();

      for (const doc of docs) {
        // Collect all potential password/hash fields that might have been defined
        const candidateHash = (
          doc.passwordHash ||
          doc.passHash ||
          doc.pass_hash ||
          doc.password_hash ||
          doc.hash ||
          doc.password ||
          ''
        ).toString().trim();

        if (!candidateHash) continue;

        // 1. Check SHA-256 (64 hex characters) - standard passwordHash
        if (candidateHash.length === 64 && safeCompareHex(candidateHash, sha256Hex)) {
          return { valid: true };
        }

        // 2. Check SHA-512 (128 hex characters)
        if (candidateHash.length === 128 && safeCompareHex(candidateHash, sha512Hex)) {
          return { valid: true };
        }

        // 3. Check SHA-384 (96 hex characters)
        if (candidateHash.length === 96 && safeCompareHex(candidateHash, sha384Hex)) {
          return { valid: true };
        }

        // 4. Check SHA-1 (40 hex characters)
        if (candidateHash.length === 40 && safeCompareHex(candidateHash, sha1Hex)) {
          return { valid: true };
        }

        // 5. Check MD5 (32 hex characters)
        if (candidateHash.length === 32 && safeCompareHex(candidateHash, md5Hex)) {
          return { valid: true };
        }

        // 6. Direct plain-text match (timing-safe via SHA-256 digest buffer comparison)
        if (doc.password && typeof doc.password === 'string') {
          const expectedBuffer = crypto.createHash('sha256').update(doc.password).digest();
          const providedBuffer = crypto.createHash('sha256').update(provided).digest();
          if (crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
            return { valid: true };
          }
        }
      }

      return { valid: false, error: 'Incorrect admin password' };
    } catch (err: any) {
      console.error('[authRepository] Error verifying admin credentials in MongoDB:', err);
      return {
        valid: false,
        error: `Database authentication error: ${err?.message || 'Failed to query MongoDB'}`,
      };
    }
  },

  /**
   * Helper to check if any admin credentials exist in MongoDB.
   */
  async hasCredentials(): Promise<boolean> {
    await initMongo();
    if (!mongoDbConnected || !mongoClient) return false;
    try {
      const db = mongoClient.db();
      const countPrimary = await db.collection('admin_auth').countDocuments();
      if (countPrimary > 0) return true;
      const countFallback = await db.collection('auth').countDocuments();
      return countFallback > 0;
    } catch {
      return false;
    }
  },
};
