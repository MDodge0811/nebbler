# Dev Pain Points Log

Friction hit while developing in this repo — things that wasted tokens, cost time, were unclear,
or where tooling fought back. Logged so it can be fixed, improving dev efficiency over time.
Reviewed periodically; fixed items move to Resolved.

## How to add an entry

Use the `log-pain-point` skill (`/log-pain-point`) — or add one manually below.

- New entries go **at the top** of `## Open` (newest first). One pain point per entry.
- Every entry needs a concrete **suggested fix** — this log exists to be acted on.

**Categories:** `tokens` (extra token cost) · `time` (slow step / waiting) ·
`clarity` (docs/instructions unclear or missing) · `tooling` (broken/awkward tooling)

### Entry format

```markdown
### YYYY-MM-DD — <short title>

- **Category:** tokens | time | clarity | tooling
- **What happened:** what you were doing and where the friction hit.
- **Cost:** rough token/time impact ("re-read 3 large files", "~5 min waiting").
- **Suggested fix:** concrete change that would prevent it next time.
- **Context:** files, commands, branch, or Linear issue (NEB-xxx).
```

---

## Open

<!-- newest entries go directly below this line -->

### 2026-06-10 — PowerSync read filtering on a non-synced column silently returns zero rows (no error)

- **Category:** tooling
- **What happened:** `useUserProfile` (`src/hooks/useConnections.ts`) queried `… WHERE id = ? AND deleted_at IS NULL`, but the client `users` PowerSync schema deliberately omits `deleted_at` (soft-deleted users never sync). PowerSync matched **zero rows with no error** — a silent failure — so the personal ProfileScreen sat on "Loading…" forever and a _connected_ PersonProfileScreen showed "isn't available." The bug predated the People-tab work but was invisible: the screen unit tests **mock the hook's return**, not the SQL against the real schema, so it only surfaced by running on the simulator.
- **Cost:** ~30 min of on-device debugging (added a temp `console.warn`, fast-refresh, narrowed `hasMe:true / hasProfile:false`); would have shipped a broken Profile/PersonProfile screen otherwise.
- **Suggested fix:** (1) Convention: client-side PowerSync reads must **not** filter on `deleted_at` for tables whose `src/database/schema.ts` Table omits it — the sync rules already exclude soft-deleted rows server-side. Ideally a lint/test that flags hook SQL referencing a column absent from the matching schema Table. (2) Add a few integration-style hook tests that execute the SQL against a schema-backed in-memory DB (or at least assert column references) instead of mocking the hook return — mocked-hook unit tests are blind to SQL/schema drift.
- **Context:** `src/hooks/useConnections.ts` (`useUserProfile`), `src/database/schema.ts` (`users` omits `deleted_at`), `src/screens/ProfileScreen.tsx`, PR nebbler#97, NEB-71.

---

## Resolved

<!-- move entries here once the underlying pain point is fixed; add **Fixed:** YYYY-MM-DD + how -->
