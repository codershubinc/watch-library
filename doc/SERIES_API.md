# Series API

Endpoints for tracking TV series, managing episodic progress, and recording network/broadcast parameters.

---

## 1. List Series

- **URL:** `/api/series`
- **Method:** `GET`
- **Authentication:** None (Public)
- **Query Parameters:**
  - `page` (optional, default: `1`): Page number.
  - `limit` (optional, default: `25`, max: `1000`): Results per page.

### cURL Example
```bash
curl -X GET "http://localhost:3001/api/series?page=1&limit=5"
```

### Sample Response
```json
{
  "series": [
    {
      "id": "673f5a11819a1b1234567892",
      "title": "Breaking Bad",
      "type": "series",
      "releaseYear": 2008,
      "network": "AMC",
      "airingStatus": "ended",
      "totalSeasons": 5,
      "totalEpisodes": 62,
      "status": "completed",
      "progress": {
        "season": 5,
        "episode": 16,
        "totalSeasons": 5,
        "totalEpisodes": 62
      },
      "rating": 9.5,
      "genres": ["Crime", "Drama", "Thriller"],
      "imdbId": "tt0903747",
      "createdAt": "2026-11-21T14:00:00.000Z",
      "updatedAt": "2026-11-21T14:30:00.000Z"
    }
  ],
  "total": 1
}
```

---

## 2. Get Series by ID

- **URL:** `/api/series/:id`
- **Method:** `GET`
- **Authentication:** None (Public)

### cURL Example
```bash
curl -X GET "http://localhost:3001/api/series/673f5a11819a1b1234567892"
```

---

## 3. Create Series

- **URL:** `/api/series`
- **Method:** `POST`
- **Authentication:** Required (Bearer Token or API Key)

### Series-Specific Parameters
| Field | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | **Yes** | Series title |
| `imdbId` | `string` | **Yes** | Unique IMDb identifier (e.g. `tt7660850`). **Required for all items.** |
| `progress` | `object` | No | `{ "season": 1, "episode": 1 }` |
| `network` | `string` | No | Original network/platform *(e.g. HBO, Netflix, Apple TV+)* |
| `airingStatus` | `string` | No | `airing`, `ended`, `canceled`, `upcoming` |
| `totalSeasons` | `number` | No | Overall season count |
| `totalEpisodes` | `number` | No | Overall episode count |
| `nextEpisodeDate` | `string` | No | Expected next release date (YYYY-MM-DD) |
| `episodesPerSeason` | `number[]` | No | e.g. `[10, 10, 8]` |
| `status` | `string` | No | `watching`, `completed`, `plan_to_watch`, `on_hold`, `dropped` |
| `rating` | `number` | No | User rating between 0 and 10 |
| `genres` | `string[]` | No | Array of genre tags |

### cURL Example
```bash
curl -X POST "http://localhost:3001/api/series" \
  -H "Authorization: Bearer wl_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Succession",
    "releaseYear": 2018,
    "network": "HBO",
    "airingStatus": "ended",
    "totalSeasons": 4,
    "totalEpisodes": 39,
    "status": "watching",
    "progress": {
      "season": 3,
      "episode": 9,
      "totalSeasons": 4,
      "totalEpisodes": 39
    },
    "rating": 9.2,
    "genres": ["Drama"],
    "imdbId": "tt7660850"
  }'
```

---

## 4. Quick Episode & Season Progress Update

Quickly advance current watching progress without sending the full object payload.

- **URL:** `/api/series/:id/progress`
- **Method:** `PATCH`
- **Authentication:** Required (Bearer Token or API Key)

### Parameters
| Field | Type | Required | Description |
|---|---|---|---|
| `season` | `number` | Optional* | Current season number being watched |
| `episode` | `number` | Optional* | Current episode number |
| `status` | `string` | Optional* | e.g. `watching` or `completed` |

*\*At least one parameter is required.*

### cURL Example
```bash
curl -X PATCH "http://localhost:3001/api/series/673f5a11819a1b1234567892/progress" \
  -H "Authorization: Bearer wl_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "season": 4,
    "episode": 1
  }'
```

### Response
```json
{
  "id": "673f5a11819a1b1234567892",
  "title": "Succession",
  "type": "series",
  "progress": {
    "season": 4,
    "episode": 1,
    "totalSeasons": 4,
    "totalEpisodes": 39
  },
  "status": "watching",
  "updatedAt": "2026-11-21T14:50:00.000Z"
}
```

---

## 5. Update Series Details

- **URL:** `/api/series/:id`
- **Method:** `PUT`
- **Authentication:** Required (Bearer Token or API Key)

### cURL Example
```bash
curl -X PUT "http://localhost:3001/api/series/673f5a11819a1b1234567892" \
  -H "Authorization: Bearer wl_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "rating": 9.6
  }'
```

---

## 6. Delete Series

- **URL:** `/api/series/:id`
- **Method:** `DELETE`
- **Authentication:** Required (Bearer Token or API Key)

### cURL Example
```bash
curl -X DELETE "http://localhost:3001/api/series/673f5a11819a1b1234567892" \
  -H "Authorization: Bearer wl_live_YOUR_API_KEY"
```
