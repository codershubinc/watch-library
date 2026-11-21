export type ApiKeyScope = 'full_access' | 'read_only';

export interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string; // e.g. "wl_live_a1b2c3d4..." (displayed in dashboard)
  keyHash: string;   // SHA-256 hash of the full key for secure storage
  scope: ApiKeyScope;
  createdAt: string;
  lastUsedAt?: string;
}

export interface GeneratedApiKey extends ApiKeyItem {
  rawKey: string;    // Only returned once upon creation!
}

export interface CreateApiKeyInput {
  name: string;
  scope?: ApiKeyScope;
}
