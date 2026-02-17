# PowerSync Troubleshooting

On-demand reference for debugging sync issues. Read this file when encountering PowerSync errors.

Docs: [PowerSync Debugging](https://docs.powersync.com/usage/tools/debugging)

## Quick Diagnostic Checklist

1. Are Docker services running? `docker compose ps` (need: postgres, powersync, api)
2. Is the API healthy? `curl http://localhost:4000/api/health`
3. Is PowerSync alive? `curl http://localhost:8080/probes/liveness`
4. Check logs: `docker compose logs -f api powersync`
5. Check sync status in app via `useSyncStatus()` hook

## Error Reference

### "Signature verification failed"

**Cause:** PowerSync cached stale JWKS (keys regenerate when API restarts)
**Fix:** `docker compose restart powersync`
**Why:** PowerSync fetches JWKS from `/api/auth/keys` on startup and caches them. If the API regenerates keys, PowerSync still has the old ones.

### "Cannot read property 'blobId' of undefined"

**Cause:** Fetch polyfill conflicts with React Native's native fetch
**Fix:** Remove `polyfillFetch()` from `index.ts` — only keep encoding and readable-stream polyfills
**Required polyfills** (`index.ts`):

```typescript
import '@azure/core-asynciterator-polyfill';
import { polyfill as polyfillEncoding } from 'react-native-polyfill-globals/src/encoding';
import { polyfill as polyfillReadableStream } from 'react-native-polyfill-globals/src/readable-stream';
polyfillEncoding();
polyfillReadableStream();
// Do NOT polyfill fetch
```

### iOS Not Connecting to Localhost

**Cause:** App Transport Security blocks HTTP connections
**Fix:** Add to `app.json`:

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSAppTransportSecurity": {
          "NSAllowsLocalNetworking": true
        }
      }
    }
  }
}
```

Then rebuild: `npx expo prebuild --clean && npx expo run:ios`

### "Connected: Yes, Has Synced: No" + Upload 500 Errors

**Cause:** Schema mismatch between Ecto and PostgreSQL column names
**Check:** Look for column name errors in API logs (`docker compose logs -f api`)
**Common culprit:** Ecto defaults to `inserted_at`/`updated_at` — ensure these match Postgres columns
**Fix:** Verify Ecto schema `timestamps()` configuration matches actual Postgres column names

### PowerSync Not Receiving Changes

**Cause:** Table not in the Postgres publication
**Check:**

```sql
SELECT * FROM pg_publication_tables WHERE pubname = 'powersync';
```

**Fix:** Add to publication:

```sql
ALTER PUBLICATION powersync ADD TABLE missing_table;
```

### JWT Missing `kid` Header

**Cause:** Guardian doesn't add `kid` to JWT header by default
**Fix:** Use JOSE directly with explicit `kid`:

```elixir
jws_header = %{"alg" => "RS256", "kid" => "nebbler-key-1"}
signed = JOSE.JWT.sign(jwk, jws_header, claims)
```

PowerSync matches the JWT `kid` against JWKS entries — without it, key lookup fails.

### web-streams-polyfill Path Error

**Cause:** Wrong version installed (v4+ changed module paths)
**Fix:** Must use version 3: `npm install web-streams-polyfill@3`

### GLIBC_2.38 Not Found (Docker Build)

**Cause:** OTP 28 requires newer glibc than standard Debian slim
**Fix:** Use `debian:trixie-slim` as the runtime base image in Dockerfile

### Upload Permanently Failing (Infinite Retry)

**Cause:** 4xx errors being thrown instead of skipped in the connector
**Check:** Look for repeated upload errors in console logs
**Fix:** The connector should return (skip) on 4xx and only throw on 5xx. See `connector-patterns.md`.

## Docker Services

| Service     | Port  | Health Check                          |
| ----------- | ----- | ------------------------------------- |
| PostgreSQL  | 5432  | `pg_isready -U postgres`              |
| PowerSync   | 8080  | `curl localhost:8080/probes/liveness` |
| Phoenix API | 4000  | `curl localhost:4000/api/health`      |
| MongoDB     | 27017 | (PowerSync internal bucket storage)   |

**Restart everything:** `cd nebbler-api && docker compose down && docker compose up -d`
**View logs:** `docker compose logs -f api powersync`
**Rebuild after schema changes:** `docker compose build api && docker compose up -d`
