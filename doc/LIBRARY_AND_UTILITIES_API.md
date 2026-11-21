# Unified Library & Utilities API

This document covers unified endpoints for managing mixed media (movies and series together), checking system and database status, proxying metadata from OMDb, and secure image caching.

---

## 1. Unified Library Endpoints (`/api/library`)

### 1.1 List Media Items (Paginated & Filterable)

```bash
curl -X GET "http://localhost:3001/api/library?page=1&limit=20&sort=title&order=asc"
```

#### Supported Query Parameters
- `page` (number, default: `1`)
- `limit` (number, default: `20`, max: `100`)
- `type` (`movie` | `series` | `all`, default: `all`)
- `status` (`Plan to Watch` | `Watching` | `Completed` | `Dropped`)
- `genre` (string, e.g. `Action`, `Drama`, `Sci-Fi`)
- `search` (string, matches title, director, network, cast)
- `sort` (`title` | `rating` | `year` | `lastSeen` | `updatedAt`)
- `order` (`asc` | `desc`)

#### Example Response (HTTP 200)
```json
{
  "items": [
    {
      "id": "1",
      "title": "Inception",
      "type": "movie",
      "year": 2010,
      "genre": ["Sci-Fi", "Action"],
      "rating": 8.8,
      "status": "Completed"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

---

### 1.2 Add Media Item (Unified)

Requires Bearer Authentication (API Key or Admin Session).

```bash
curl -X POST http://localhost:3001/api/library \
  -H "Authorization: Bearer wl_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Interstellar",
    "type": "movie",
    "year": 2014,
    "genre": ["Adventure", "Drama", "Sci-Fi"],
    "rating": 8.7,
    "status": "Completed",
    "durationMinutes": 169,
    "director": "Christopher Nolan"
  }'
```

---

### 1.3 Update Media Item by ID

Requires Bearer Authentication.

```bash
curl -X PUT http://localhost:3001/api/library/1 \
  -H "Authorization: Bearer wl_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 9.0,
    "status": "Completed"
  }'
```

---

### 1.4 Delete Media Item by ID

Requires Bearer Authentication.

```bash
curl -X DELETE http://localhost:3001/api/library/1 \
  -H "Authorization: Bearer wl_live_YOUR_API_KEY"
```

---

### 1.5 Quick Update Series Episode Progress

Requires Bearer Authentication.

```bash
curl -X PATCH http://localhost:3001/api/library/2/progress \
  -H "Authorization: Bearer wl_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "season": 2,
    "episode": 5
  }'
```

---

## 2. System & Database Status (`GET /api/status`)

Checks server health, storage backend (`mongodb` or `memory`), and active media record counts.

```bash
curl -X GET http://localhost:3001/api/status
```

#### Example Response (HTTP 200)
```json
{
  "connected": true,
  "mode": "mongodb",
  "itemCount": 42
}
```

---

## 3. OMDb Metadata Proxy (`GET /api/omdb`)

Fetches metadata and poster links directly from the Open Movie Database API.

> [!NOTE]
> Requires `OMDB_API_KEY` configured in `.env.local` or environment variables.

### By Title and Year
```bash
curl -X GET "http://localhost:3001/api/omdb?t=Inception&y=2010"
```

### By IMDb ID
```bash
curl -X GET "http://localhost:3001/api/omdb?i=tt1375666"
```

#### Example Response (HTTP 200)
```json
{
  "Title": "Inception",
  "Year": "2010",
  "Rated": "PG-13",
  "Released": "16 Jul 2010",
  "Runtime": "148 min",
  "Genre": "Action, Adventure, Sci-Fi",
  "Director": "Christopher Nolan",
  "Poster": "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg",
  "imdbRating": "8.8",
  "imdbID": "tt1375666",
  "Type": "movie",
  "Response": "True"
}
```

---

## 4. Secure Cached Image Proxy (`GET /api/images/cache`)

Proxies and delivers remote movie and series posters with HTTP browser caching. No server disk storage is used.

### Security & Caching Guarantees:
- **SSRF Hardened**: Prohibits private, loopback (`127.0.0.1`), metadata (`169.254.169.254`), and link-local IP addresses.
- **Payload Bound**: Maximum 10MB payload size limit.
- **Content-Type Whitelist**: Accepts raster images only (`image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/avif`). Rejects SVG and scriptable formats.
- **Browser HTTP Caching**: Emits `Cache-Control: public, max-age=31536000, immutable` and `ETag`. Supports conditional `If-None-Match` requests returning `304 Not Modified` with zero server re-download. Zero bytes stored on server disk.

### Example Request
```bash
curl -X GET "http://localhost:3001/api/images/cache?url=https%3A%2F%2Fm.media-amazon.com%2Fimages%2FM%2FMV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw%40%40._V1_SX300.jpg" \
  --output poster.jpg
```
