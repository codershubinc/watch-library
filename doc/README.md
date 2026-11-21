# Watch Library API Documentation

This directory contains complete documentation and `curl` examples for every API endpoint available in the **Watch Library** backend.

---

## Documentation Index

- [**CURL Quick Cheatsheet**](./CURL_CHEATSHEET.md) - One-liner `curl` commands for all endpoints.
- [**Authentication & API Keys**](./AUTHENTICATION_AND_KEYS.md) - Managing API Keys, rate limits, and using Bearer tokens across external projects.
- [**Movies API**](./MOVIES_API.md) - Full CRUD examples for movie records.
- [**Series API**](./SERIES_API.md) - Full CRUD and progress tracking examples for TV series.
- [**Last Seen & IMDb Lookup API**](./LAST_SEEN_AND_IMDB_API.md) - Fast lookups for most recently updated titles and IMDb ID searches.
- [**Unified Library & Utilities API**](./LIBRARY_AND_UTILITIES_API.md) - Unified catalog queries, OMDB proxy, image caching, and DB status.
- [**Advanced Endpoints**](./ADVANCED_ENDPOINTS.md) - Analytics stats, fast search, random title picker, bulk batch import, backups/export, and Plex/Jellyfin scrobble webhook.

---

## Base URL

During local development with Bun:
```
http://localhost:3001
```

---

## Security & Access Model

1. **Mutating Endpoints (`POST`, `PUT`, `PATCH`, `DELETE`)**:
   - Strictly protected. Require an authenticated API Key or Admin Session Token.
   - Missing or invalid credentials return `HTTP 401 Unauthorized`.

2. **Read-Only Endpoints (`GET`)**:
   - **With API Key**: Full, unrestricted, unthrottled access (`X-RateLimit-Limit: unlimited`).
   - **Without API Key (Public)**: Allowed, with an automated rate limit shield of **30 requests per second** per IP address.
   - Exceeding 30 req/sec returns `HTTP 429 Too Many Requests` with `Retry-After: 1`.

---

## Authentication Modes

Pass your API key using standard HTTP headers:
1. **Bearer Token (Standard & Recommended)**:
   ```http
   Authorization: Bearer wl_live_YOUR_API_KEY
   ```
2. **Custom Header**:
   ```http
   x-api-key: wl_live_YOUR_API_KEY
   ```

---

## CORS & Cross-Project Access

All `/api/*` endpoints have Cross-Origin Resource Sharing (CORS) enabled by default:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, x-api-key`
- Preflight `OPTIONS` requests are handled automatically on all routes.
