# Movies API

Endpoints for retrieving, creating, updating, and removing movie titles.

---

## 1. List Movies

Returns a paginated list of movies sorted by most recently updated.

- **URL:** `/api/movies`
- **Method:** `GET`
- **Authentication:** None (Public)
- **Query Parameters:**
  - `page` (optional, default: `1`): Current page number.
  - `limit` (optional, default: `25`, max: `1000`): Results per page.

### cURL Example
```bash
curl -X GET "http://localhost:3001/api/movies?page=1&limit=2"
```

### Sample Response
```json
{
  "movies": [
    {
      "id": "673f4e2b819a1b1234567890",
      "title": "Inception",
      "type": "movie",
      "posterUrl": "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_.jpg",
      "releaseYear": 2010,
      "director": "Christopher Nolan",
      "durationMinutes": 148,
      "status": "completed",
      "rating": 8.8,
      "genres": ["Action", "Sci-Fi", "Adventure"],
      "imdbId": "tt1375666",
      "plot": "A thief who steals corporate secrets through dream-sharing technology...",
      "createdAt": "2026-11-21T14:00:00.000Z",
      "updatedAt": "2026-11-21T14:30:00.000Z"
    }
  ],
  "total": 1
}
```

---

## 2. Get Movie by ID

- **URL:** `/api/movies/:id`
- **Method:** `GET`
- **Authentication:** None (Public)

### cURL Example
```bash
curl -X GET "http://localhost:3001/api/movies/673f4e2b819a1b1234567890"
```

### Response (Found)
```json
{
  "id": "673f4e2b819a1b1234567890",
  "title": "Inception",
  "type": "movie",
  "releaseYear": 2010,
  "director": "Christopher Nolan",
  "durationMinutes": 148,
  "status": "completed",
  "rating": 8.8,
  "genres": ["Action", "Sci-Fi"]
}
```

### Response (Not Found - HTTP 404)
```json
{
  "error": "Movie not found"
}
```

---

## 3. Create Movie

- **URL:** `/api/movies`
- **Method:** `POST`
- **Authentication:** Required (Bearer Token or API Key)
- **Headers:**
  - `Authorization: Bearer <API_KEY>`
  - `Content-Type: application/json`

### Supported Parameters
| Field | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | **Yes** | Title of the movie |
| `imdbId` | `string` | **Yes** | Unique IMDb identifier (e.g. `tt0816692`). **Required for all items.** |
| `releaseYear` | `number` | No | Year released (1800-2100) |
| `director` | `string` | No | Director name *(movie-specific)* |
| `durationMinutes` | `number` | No | Runtime in minutes *(movie-specific)* |
| `status` | `string` | No | `watching`, `completed`, `plan_to_watch`, `on_hold`, `dropped` |
| `rating` | `number` | No | User rating between 0 and 10 |
| `genres` | `string[]` or CSV `string` | No | e.g. `["Sci-Fi", "Drama"]` |
| `posterUrl` | `string` | No | URL to poster image |
| `backdropUrl` | `string` | No | URL to wide backdrop image |
| `imdbId` | `string` | No | Unique IMDb identifier (e.g. `tt0816692`) |
| `plot` | `string` | No | Summary or synopsis |
| `notes` | `string` | No | Personal notes or review |

### cURL Example
```bash
curl -X POST "http://localhost:3001/api/movies" \
  -H "Authorization: Bearer wl_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Dune: Part Two",
    "releaseYear": 2024,
    "director": "Denis Villeneuve",
    "durationMinutes": 166,
    "status": "completed",
    "rating": 9.0,
    "genres": ["Action", "Adventure", "Sci-Fi"],
    "imdbId": "tt15239678",
    "plot": "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family."
  }'
```

### Response (HTTP 201 Created)
```json
{
  "id": "673f4e2b819a1b1234567891",
  "title": "Dune: Part Two",
  "type": "movie",
  "releaseYear": 2024,
  "director": "Denis Villeneuve",
  "durationMinutes": 166,
  "status": "completed",
  "rating": 9.0,
  "genres": ["Action", "Adventure", "Sci-Fi"],
  "imdbId": "tt15239678",
  "createdAt": "2026-11-21T14:45:00.000Z",
  "updatedAt": "2026-11-21T14:45:00.000Z"
}
```

---

## 4. Update Movie

- **URL:** `/api/movies/:id`
- **Method:** `PUT`
- **Authentication:** Required (Bearer Token or API Key)

### cURL Example
```bash
curl -X PUT "http://localhost:3001/api/movies/673f4e2b819a1b1234567891" \
  -H "Authorization: Bearer wl_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 9.5,
    "notes": "Spectacular cinematography and sound design."
  }'
```

---

## 5. Delete Movie

- **URL:** `/api/movies/:id`
- **Method:** `DELETE`
- **Authentication:** Required (Bearer Token or API Key)

### cURL Example
```bash
curl -X DELETE "http://localhost:3001/api/movies/673f4e2b819a1b1234567891" \
  -H "Authorization: Bearer wl_live_YOUR_API_KEY"
```

### Response (HTTP 200)
```json
{
  "success": true,
  "message": "Movie deleted successfully"
}
```
