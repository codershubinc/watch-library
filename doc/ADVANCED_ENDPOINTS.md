# Advanced Endpoints: Stats, Search, Random, Batch & Scrobble

These endpoints power integrations like media center scrobblers (Plex, Jellyfin, Kodi), automation workflows, backup/export jobs, and client dashboard analytics.

---

## 1. Library Statistics (`GET /api/stats`)

Computes aggregated analytics across your entire library in one fast query.

```bash
curl -X GET http://localhost:3001/api/stats
```

### Example Response (HTTP 200)
```json
{
  "totalCount": 42,
  "moviesCount": 26,
  "seriesCount": 16,
  "statusBreakdown": {
    "watching": 4,
    "completed": 28,
    "plan_to_watch": 8,
    "on_hold": 1,
    "dropped": 1
  },
  "topGenres": [
    { "genre": "Sci-Fi", "count": 18 },
    { "genre": "Drama", "count": 15 },
    { "genre": "Action", "count": 12 }
  ],
  "averageRating": 8.42,
  "totalMovieDurationMinutes": 3840,
  "totalEpisodesWatched": 142
}
```

---

## 2. Fast Autocomplete & Search (`GET /api/search`)

Searches across title, director, network, plot, and genres with configurable limits.

```bash
curl -X GET "http://localhost:3001/api/search?q=nolan&limit=10"
```

### Example Response (HTTP 200)
```json
{
  "query": "nolan",
  "total": 3,
  "results": [
    {
      "id": "1",
      "title": "Inception",
      "type": "movie",
      "releaseYear": 2010,
      "director": "Christopher Nolan",
      "rating": 8.8,
      "status": "completed"
    },
    {
      "id": "2",
      "title": "Interstellar",
      "type": "movie",
      "releaseYear": 2014,
      "director": "Christopher Nolan",
      "rating": 8.7,
      "status": "completed"
    }
  ]
}
```

---

## 3. "What Should I Watch Next?" Random Picker (`GET /api/random`)

Selects a random title from your catalog matching optional filters (`type`, `status`, `genre`).

```bash
curl -X GET "http://localhost:3001/api/random?type=movie&status=plan_to_watch&genre=Sci-Fi"
```

### Example Response (HTTP 200)
```json
{
  "success": true,
  "item": {
    "id": "3",
    "title": "Arrival",
    "type": "movie",
    "releaseYear": 2016,
    "genres": ["Drama", "Mystery", "Sci-Fi"],
    "rating": 7.9,
    "status": "plan_to_watch"
  }
}
```

---

## 4. Bulk Batch Import / Sync (`POST /api/library/batch`)

Imports up to 1,000 items at once with automatic deduplication by IMDb ID.

Requires an API Key or Admin Session.

```bash
curl -X POST http://localhost:3001/api/library/batch \
  -H "Authorization: Bearer wl_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "onDuplicate": "update",
    "items": [
      {
        "title": "Dune: Part Two",
        "type": "movie",
        "releaseYear": 2024,
        "rating": 8.6,
        "status": "completed",
        "imdbId": "tt15239678"
      },
      {
        "title": "The Bear",
        "type": "series",
        "releaseYear": 2022,
        "status": "watching",
        "totalSeasons": 3,
        "totalEpisodes": 28,
        "imdbId": "tt14452792"
      }
    ]
  }'
```

### Example Response (HTTP 201)
```json
{
  "success": true,
  "message": "Successfully processed 2 items (Added: 1, Updated: 1, Skipped: 0)",
  "added": 1,
  "updated": 1,
  "skipped": 0,
  "totalProcessed": 2
}
```

---

## 5. Library Backup & Export (`GET /api/library/export`)

Exports your entire library database as clean JSON or CSV for offsite backup.

Requires an API Key or Admin Session.

### JSON Export:
```bash
curl -X GET "http://localhost:3001/api/library/export?format=json" \
  -H "Authorization: Bearer wl_live_YOUR_API_KEY" \
  -o backup.json
```

### CSV Export:
```bash
curl -X GET "http://localhost:3001/api/library/export?format=csv" \
  -H "Authorization: Bearer wl_live_YOUR_API_KEY" \
  -o backup.csv
```

---

## 6. Media Scrobble Webhook (`POST /api/webhooks/scrobble`)

Integrates with media servers (Plex, Jellyfin, Kodi, Home Assistant) or automated agents.

- **Auto-Enrichment**: If artwork poster, plot, year, director, or genres are not passed, the endpoint **automatically queries OMDb using the IMDb ID** to populate official poster artwork and metadata!
- **Payload Flexibility**: Supports `tmdbId`, `posterUrl` / `artwork`, `backdropUrl`, `director`, `genres`, and `plot`.
- **Existing Titles**: If the title already exists, updates watch status or episode progress, and backfills any missing artwork or `tmdbId`.
- **New Titles**: If the title does not exist in your catalog, automatically creates it fully populated with artwork and metadata!

Requires an API Key (`Authorization: Bearer wl_live_...` or query param `?apiKey=wl_live_...`).

### Scrobble Movie Watched (Auto-Enriches Poster & Details):
```bash
curl -X POST "http://localhost:3001/api/webhooks/scrobble?apiKey=wl_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "imdbId": "tt1877830",
    "tmdbId": "414906",
    "rating": 8.5,
    "status": "completed"
  }'
```
*(The server automatically fetches title "The Batman", poster artwork, 2022 release year, genres, plot, and runtime from OMDb!)*

### Scrobble Series Episode Watched (With Explicit Artwork):
```bash
curl -X POST "http://localhost:3001/api/webhooks/scrobble?apiKey=wl_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "imdbId": "tt11280740",
    "tmdbId": "95396",
    "artwork": "https://m.media-amazon.com/images/M/MV5BZDI5YzJhODQtMzQyNy00YWNmLWIxMjUtNDBjNjA5YWRjMzExXkEyXkFqcGc@._V1_SX300.jpg",
    "season": 2,
    "episode": 3,
    "status": "watching"
  }'
```

### Example Response (HTTP 200)
```json
{
  "success": true,
  "action": "updated_series_progress",
  "item": {
    "id": "1732194829103",
    "title": "Severance",
    "progress": {
      "season": 2,
      "episode": 3
    },
    "status": "watching",
    "updatedAt": "2026-11-21T20:30:00.000Z"
  }
}
```
