# Last Seen & IMDb Lookup API

Dedicated lightweight endpoints designed for fast integrations, media center displays, widgets, and external scrapers.

---

## 1. Last Seen / Most Recent Entry (`GET /api/last-seen`)

Returns the most recently viewed or watched entry in your library.

> [!NOTE]
> **Decoupled from `updatedAt`**: The query sorts strictly by `lastSeen: -1, createdAt: -1`. Editing a movie's review, notes, or rating later updates `updatedAt` but **never** overwrites `lastSeen`. Updating a series episode progress or scrobbling advances `lastSeen` automatically.

### Query Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `type` | string | Optional | Filter by media type: `movie` or `series`. If omitted, returns the latest of either. |
| `status` | string | Optional | Filter by watch status: `completed` (or alias `watched`), or `watching`. By default, only actually watched titles are returned (`plan_to_watch` / watchlist titles are excluded). |

---

### 1.1 Fetch Latest Media (Any Type)

```bash
curl -X GET http://localhost:3001/api/last-seen
```

#### Example Response (HTTP 200)
```json
{
  "success": true,
  "item": {
    "id": "1732194829103",
    "title": "Severance",
    "type": "series",
    "year": 2022,
    "genre": ["Sci-Fi", "Thriller"],
    "rating": 8.7,
    "status": "Watching",
    "seasons": 2,
    "episodes": 19,
    "progress": {
      "season": 1,
      "episode": 9,
      "lastWatched": "2026-11-21T18:30:00.000Z"
    },
    "network": "Apple TV+",
    "airingStatus": "Returning Series",
    "updatedAt": "2026-11-21T18:30:00.000Z"
  }
}
```

---

### 1.2 Fetch Last Seen Movie Only

```bash
curl -X GET "http://localhost:3001/api/last-seen?type=movie"
```

#### Example Response (HTTP 200)
```json
{
  "success": true,
  "item": {
    "id": "1732194829100",
    "title": "Dune: Part Two",
    "type": "movie",
    "year": 2024,
    "genre": ["Sci-Fi", "Adventure"],
    "rating": 8.5,
    "status": "Completed",
    "durationMinutes": 166,
    "director": "Denis Villeneuve",
    "lastSeen": "2026-11-20T21:45:00.000Z",
    "updatedAt": "2026-11-20T21:45:00.000Z"
  }
}
```

---

### 1.3 Fetch Last Seen TV Series Only

```bash
curl -X GET "http://localhost:3001/api/last-seen?type=series"
```

---

### 1.4 Response When Library Is Empty (HTTP 200)
```json
{
  "success": false,
  "item": null,
  "message": "No entries found in library"
}
```

---

## 2. Existence Lookup by IMDb ID or Title (`GET /api/imdb/:id`)

Checks if a specific movie or series exists in your local library. The endpoint automatically detects whether the query is an **IMDb ID** (e.g. `tt0111161`) or a **Title** (e.g. `Inception`).

### 2.1 Lookup by IMDb ID (Path Parameter)
```bash
curl -X GET http://localhost:3001/api/imdb/tt0111161
```

### 2.2 Lookup by Title (Path Parameter)
```bash
curl -X GET "http://localhost:3001/api/imdb/Inception"
```

### 2.3 Lookup via Query Parameters
```bash
# By IMDb ID:
curl -X GET "http://localhost:3001/api/imdb?id=tt0111161"

# By Title:
curl -X GET "http://localhost:3001/api/imdb?title=Inception"
```

---

### 2.4 Success Response (Item Exists, HTTP 200)
```json
{
  "success": true,
  "matchType": "imdbId",
  "item": {
    "id": "1732194829101",
    "title": "The Shawshank Redemption",
    "type": "movie",
    "year": 1994,
    "genre": ["Drama"],
    "rating": 9.3,
    "status": "Completed",
    "imdbId": "tt0111161",
    "durationMinutes": 142,
    "director": "Frank Darabont"
  }
}
```

---

### 2.5 Not Found Response (Item Missing, HTTP 404)
```json
{
  "success": false,
  "item": null,
  "message": "No media found matching identifier: \"tt9999999\""
}
```
