# cURL Quick Cheatsheet

Set your base URL and API key in your shell:
```bash
export API_URL="http://localhost:3001"
export API_KEY="wl_live_YOUR_API_KEY"
```

---

## 1. System & Health

### Check Database Status
```bash
curl -X GET "$API_URL/api/status"
```

---

## 2. Fast Lookups

### Get Last Seen / Most Recently Updated Title
```bash
# Any title
curl -X GET "$API_URL/api/last-seen"

# Only last movie
curl -X GET "$API_URL/api/last-seen?type=movie"

# Only last series
curl -X GET "$API_URL/api/last-seen?type=series"
```

### Lookup Entry by IMDb ID
```bash
# Path parameter
curl -X GET "$API_URL/api/imdb/tt0133093"

# Query parameter
curl -X GET "$API_URL/api/imdb?id=tt0133093"
```

---

## 3. Movies API

### List Movies (Paginated)
```bash
curl -X GET "$API_URL/api/movies?page=1&limit=10"
```

### Get Movie by ID
```bash
curl -X GET "$API_URL/api/movies/MOVIE_ID"
```

### Add New Movie
```bash
curl -X POST "$API_URL/api/movies" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Interstellar",
    "releaseYear": 2014,
    "director": "Christopher Nolan",
    "durationMinutes": 169,
    "status": "completed",
    "rating": 9.2,
    "genres": ["Sci-Fi", "Adventure", "Drama"],
    "imdbId": "tt0816692",
    "plot": "A team of explorers travel through a wormhole in space in an attempt to ensure humanity survival."
  }'
```

### Update Movie
```bash
curl -X PUT "$API_URL/api/movies/MOVIE_ID" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 9.5,
    "notes": "Rewatched in IMAX."
  }'
```

### Delete Movie
```bash
curl -X DELETE "$API_URL/api/movies/MOVIE_ID" \
  -H "Authorization: Bearer $API_KEY"
```

---

## 4. Series API

### List Series (Paginated)
```bash
curl -X GET "$API_URL/api/series?page=1&limit=10"
```

### Get Series by ID
```bash
curl -X GET "$API_URL/api/series/SERIES_ID"
```

### Add New Series
```bash
curl -X POST "$API_URL/api/series" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Severance",
    "releaseYear": 2022,
    "network": "Apple TV+",
    "airingStatus": "airing",
    "totalSeasons": 2,
    "totalEpisodes": 19,
    "status": "watching",
    "progress": {
      "season": 1,
      "episode": 9,
      "totalSeasons": 2,
      "totalEpisodes": 19
    },
    "rating": 9.0,
    "genres": ["Sci-Fi", "Mystery", "Thriller"],
    "imdbId": "tt11280740"
  }'
```

### Update Watching Progress (Season & Episode)
```bash
curl -X PATCH "$API_URL/api/series/SERIES_ID/progress" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "season": 2,
    "episode": 1,
    "status": "watching"
  }'
```

### Update Series Details
```bash
curl -X PUT "$API_URL/api/series/SERIES_ID" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "rating": 9.3
  }'
```

### Delete Series
```bash
curl -X DELETE "$API_URL/api/series/SERIES_ID" \
  -H "Authorization: Bearer $API_KEY"
```

---

## 5. API Keys Management

### List Active API Keys
```bash
curl -X GET "$API_URL/api/keys" \
  -H "Authorization: Bearer $API_KEY"
```

### Generate a New API Key
```bash
curl -X POST "$API_URL/api/keys" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mobile App Client",
    "scope": "full_access"
  }'
```

### Revoke an API Key
```bash
curl -X DELETE "$API_URL/api/keys/KEY_ID" \
  -H "Authorization: Bearer $API_KEY"
```

---

## 6. Image Caching Proxy

### Fetch and Cache Remote Image
```bash
curl -X GET "$API_URL/api/images/cache?url=https%3A%2F%2Fm.media-amazon.com%2Fimages%2FM%2FMV5BNDE3ODcxNzMtYjUxZS00fc00-poster.jpg" \
  --output cached_poster.jpg
```
