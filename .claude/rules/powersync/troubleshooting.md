# PowerSync Troubleshooting

On-demand reference for debugging sync issues. Read this file when encountering PowerSync errors.

Docs: [PowerSync Debugging](https://docs.powersync.com/usage/tools/debugging)

## Quick Diagnostic Checklist

> **Worktree note:** Default ports below assume the main stack. In a worktree, ports are offset (e.g. slot 1: API=4100, PowerSync=8180). Check the worktree's `api/.env` for actual port values.

1. Are Docker services running? `docker compose ps` (need: postgres, powersync, api)
2. Is the API healthy? `curl http://localhost:4000/api/health`
3. Is PowerSync alive? `curl http://localhost:8080/probes/liveness`
4. Check logs: `docker compose logs -f api powersync`
5. Check sync status in app via `useSyncStatus()` hook

## Error Reference

### "Signature verification failed"

**Cause:** PowerSync's `PS_JWKS_URL` is not pointed at Clerk, or Clerk rotated keys faster than the PowerSync container could refresh.
**Fix:**

1. Confirm `PS_JWKS_URL` in `docker-compose.yml` resolves to `https://${CLERK_FRONTEND_API}/.well-known/jwks.json` and that `CLERK_FRONTEND_API` is set in `.env`.
2. `docker compose restart powersync` to force a fresh JWKS fetch.
3. If still failing, decode the token at [jwt.io](https://jwt.io) — the `kid` header must match a key currently published in Clerk's JWKS, and `aud` must be `powersync` (matching the audience in `powersync.yaml`).

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

### Missing `user_id` claim / sync rules return zero rows

**Cause:** The Clerk JWT template for PowerSync doesn't embed `user_id`, or the user's `publicMetadata.internal_user_id` isn't set yet.
**Check:**

1. Decode the token PowerSync received (server logs show it on auth). Confirm `user_id` is present and is a UUID.
2. In the Clerk dashboard → JWT Templates → `powersync`, confirm the claim is `"user_id": "{{user.public_metadata.internal_user_id}}"`.
3. Hit `https://api.clerk.com/v1/users/<clerk_user_id>` (with `CLERK_SECRET_KEY`) and verify `public_metadata.internal_user_id` is set.
   **Fix:** If metadata is missing, the `/api/webhooks/clerk` handler hasn't run successfully. Re-trigger by resending the `user.created` event from the Clerk dashboard, or call `NebblerApi.Clerk.set_internal_user_id/2` manually from an IEx session.

### "No Clerk session — cannot fetch PowerSync token"

**Cause:** `fetchCredentials` ran before `ClerkPowerSyncBridge` installed the token getter.
**Fix:** Should self-heal on the next sign-in. If it persists, check that `App.tsx` wraps `<PowerSyncContext.Provider>` **inside** `<ClerkProvider>` and that `<ClerkPowerSyncBridge />` is rendered before `<AppNavigator />`.

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

Ports are defaults — in worktrees they're offset via `.env` (e.g. slot 1: +100).

| Service     | Default Port | Health Check                          |
| ----------- | ------------ | ------------------------------------- |
| PostgreSQL  | 5432         | `pg_isready -U postgres`              |
| PowerSync   | 8080         | `curl localhost:8080/probes/liveness` |
| Phoenix API | 4000         | `curl localhost:4000/api/health`      |
| MongoDB     | 27017        | (PowerSync internal bucket storage)   |

**Restart everything:** `cd nebbler-api && docker compose down && docker compose up -d`
**View logs:** `docker compose logs -f api powersync`
**Rebuild after schema changes:** `docker compose build api && docker compose up -d`
