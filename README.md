# Watch Library

A full-stack personal movie and TV series library built with Next.js, React, Tailwind CSS, and MongoDB. Track what you are watching, manage episode progress, enrich titles via OMDb, and expose your catalog through a CORS-enabled REST API.

---

## Features

- **Public Catalog & Showcase UI** — Browse movies and series with search, status/type filtering, sorting, pagination or infinite scroll, detail modals, and a spotlight view for currently watching series.
- **Episode & Watch Progress Tracking** — Track `watching`, `completed`, `plan_to_watch`, `on_hold`, and `dropped` statuses, ratings, notes, and season/episode progress with quick-increment controls.
- **OMDb Metadata & Image Caching** — Look up and auto-enrich title metadata (poster, plot, genres, release year, runtime, director) via OMDb, plus an SSRF-protected image caching proxy (`/api/images/cache`).
- **Admin Authentication & API Keys** — Timing-safe password verification against MongoDB (`admin_auth` collection), persistent 24-hour session tokens, and scoped `wl_live_*` API keys managed from `/api-keys`.
- **Import, Export & Scrobbling** — Bulk import via CSV/JSON (`/api/library/batch`), export backups (`/api/library/export`), view library statistics (`/api/stats`), pick a random title (`/api/random`), and receive Plex/Jellyfin scrobble events (`/api/webhooks/scrobble`).
- **Built-in API Documentation** — Interactive API reference and `curl` examples available in-app at [`/doc`](/doc) and in [`doc/README.md`](./doc/README.md).

---

## Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling & UI:** Tailwind CSS v4, Motion, Lucide React
- **Database:** MongoDB (with automatic in-memory fallback when `MONGODB_URI` is unset)

---

## Getting Started

### 1. Install dependencies

```bash
bun install
```

*(You can also use `npm install` if you prefer Node/npm.)*

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your values:

```env
MONGODB_URI="mongodb+srv://<user>:<password>@<cluster>/<dbname>"
OMDB_API_KEY="your_omdb_api_key"
```

- `MONGODB_URI` *(optional for read/demo usage)* — MongoDB connection string. Without it, the app falls back to an ephemeral in-memory store. MongoDB is required for persistent storage, admin login, and API keys.
- `OMDB_API_KEY` *(optional)* — Required for `/api/omdb` lookups and automatic metadata enrichment in `/api/webhooks/scrobble`.

### 3. Set up an admin account (for write access)

Admin login (`/login`) verifies passwords against documents in the `admin_auth` (or `auth`) collection in MongoDB. Supported fields include `passwordHash` (SHA-256, SHA-512, SHA-384, SHA-1, MD5) or `password`.

Example document in `admin_auth`:

```json
{
  "username": "admin",
  "role": "admin",
  "passwordHash": "<sha256-hex-of-your-password>"
}
```

### 4. Run the application

```bash
# Development server (http://localhost:3001)
bun run dev

# Production build & start (http://localhost:3001)
bun run build
bun run start

# Lint
bun run lint
```

---

## API Overview

All `/api/*` routes support CORS (`Access-Control-Allow-Origin: *`) and preflight `OPTIONS` requests.

- **Public `GET` endpoints:** Open without authentication, rate-limited to **30 requests/second** per IP. Passing an API key removes the rate limit.
- **Mutating endpoints (`POST`, `PUT`, `PATCH`, `DELETE`):** Require either an active admin session token or an API key:
  ```http
  Authorization: Bearer wl_live_YOUR_API_KEY
  ```
  or
  ```http
  x-api-key: wl_live_YOUR_API_KEY
  ```

### Main Endpoints

| Area | Endpoints |
| --- | --- |
| **Library** | `GET/POST /api/library`, `GET/PUT/PATCH/DELETE /api/library/[id]`, `PATCH /api/library/[id]/progress`, `POST /api/library/batch`, `GET /api/library/export` |
| **Movies & Series** | `GET/POST /api/movies`, `GET/PUT/PATCH/DELETE /api/movies/[id]`, `GET/POST /api/series`, `GET/PUT/PATCH/DELETE /api/series/[id]`, `PATCH /api/series/[id]/progress` |
| **Discovery & Stats** | `GET /api/search`, `GET /api/stats`, `GET /api/random`, `GET /api/last-seen`, `GET /api/imdb`, `GET /api/imdb/[id]` |
| **Utilities & Webhooks** | `GET /api/omdb`, `GET /api/images/cache`, `GET /api/status`, `POST /api/webhooks/scrobble` |
| **Auth & Keys** | `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/verify`, `GET/POST /api/keys`, `DELETE /api/keys/[id]` |

For full request/response payloads and `curl` examples, visit `http://localhost:3001/doc` while running the app or browse the [API documentation](./doc/README.md).
