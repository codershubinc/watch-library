# Authentication & API Keys API

The Watch Library backend enforces security and rate limits on all API endpoints:
1. **Mutating Endpoints (`POST`, `PUT`, `PATCH`, `DELETE`)**: Strictly protected by an API Key or Admin Session Token.
2. **Read-Only Endpoints (`GET`)**: Publicly accessible with a **30 requests/second** sliding rate limit per IP. Providing an API Key removes all rate limits for unlimited access.

Supported authentication methods:
- `Authorization: Bearer <TOKEN_OR_KEY>`
- `x-api-key: <KEY>`
- `?apiKey=<KEY>`

---

## 1. Rate Limiting for Read-Only Endpoints

When accessing `GET` endpoints without an API key, the server allows up to **30 requests per second** per IP address.

### Rate Limit Response Headers (Unauthenticated)
```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 28
X-RateLimit-Reset: 1
```

### Rate Limit Exceeded Response (HTTP 429)
When an IP exceeds 30 requests within a 1-second window:
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 1
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1
Content-Type: application/json

{
  "success": false,
  "error": "Rate limit exceeded. Maximum 30 requests per second for unauthenticated requests. Please provide an API key (Authorization: Bearer wl_live_...) for unrestricted access.",
  "limit": 30,
  "window": "1 second"
}
```

> [!TIP]
> Include an API key (`Authorization: Bearer wl_live_...`) to bypass rate limits entirely (`X-RateLimit-Limit: unlimited`).

---

## 2. API Keys Management

API keys grant full access to read and mutate your library catalog.

> [!NOTE]
> The full raw API key (e.g. `wl_live_1234...`) is **only displayed once** upon creation. Only its SHA-256 hash is stored in the database.

### 2.1 List API Keys
Retrieve all active API keys.

```bash
curl -X GET http://localhost:3001/api/keys \
  -H "Authorization: Bearer wl_live_YOUR_API_KEY"
```

#### Example Response (HTTP 200)
```json
{
  "success": true,
  "keys": [
    {
      "id": "1732200000000",
      "name": "Home Assistant Automation",
      "keyPrefix": "wl_live_a1b2c3d4",
      "createdAt": "2026-11-21T18:00:00.000Z",
      "lastUsedAt": "2026-11-21T19:45:12.000Z"
    }
  ]
}
```

---

### 2.2 Create an API Key
Generate a new high-entropy Bearer token.

```bash
curl -X POST http://localhost:3001/api/keys \
  -H "Authorization: Bearer wl_live_YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mobile Dashboard App"
  }'
```

#### Example Response (HTTP 201)
```json
{
  "success": true,
  "key": {
    "id": "1732200123456",
    "name": "Mobile Dashboard App",
    "key": "wl_live_d8e9f01a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e",
    "keyPrefix": "wl_live_d8e9f01a",
    "createdAt": "2026-11-21T19:50:00.000Z"
  }
}
```

---

### 2.3 Revoke / Delete an API Key
Permanently invalidate an API key by its `id`.

```bash
curl -X DELETE http://localhost:3001/api/keys/1732200123456 \
  -H "Authorization: Bearer wl_live_YOUR_API_KEY"
```

#### Example Response (HTTP 200)
```json
{
  "success": true,
  "message": "API key revoked successfully"
}
```

---

## 3. Admin Session Authentication (Web UI Flow)

### 3.1 Admin Login
Authenticate using the server administrator password configured in `ADMIN_PASSWORD`.

> [!NOTE]
> Protected by brute-force rate limiting: maximum 5 failed attempts per 15-minute window per IP. Password checks use constant-time comparison to prevent timing attacks.

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "password": "YOUR_ADMIN_PASSWORD"
  }'
```

#### Example Response (HTTP 200)
```json
{
  "success": true,
  "token": "4f9d2a1b7e6c5a3b8d1f4e7c2a5b8d9e",
  "expiresAt": "2026-11-22T20:00:00.000Z"
}
```

---

## 4. Integrating with Other Projects

### JavaScript / TypeScript (fetch)
```typescript
const API_URL = 'http://localhost:3001/api/movies';
const API_KEY = 'wl_live_YOUR_API_KEY';

async function fetchMovies() {
  const res = await fetch(API_URL, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Accept': 'application/json'
    }
  });
  return res.json();
}
```

### Python (requests)
```python
import requests

API_URL = "http://localhost:3001/api/last-seen"
API_KEY = "wl_live_YOUR_API_KEY"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Accept": "application/json"
}

response = requests.get(API_URL, headers=headers)
print(response.json())
```
