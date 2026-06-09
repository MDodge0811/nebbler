---
name: log-pain-point
description: Record a dev-cycle pain point — something that wasted tokens, cost time, was unclear, or where tooling fought back — into this repo's docs/dev-pain-points.md. Use proactively the moment friction is hit, or at wrap-up when reflecting on the session. Creates the log file with a header if it doesn't exist yet.
argument-hint: Optional one-line description of the pain point
allowed-tools: Read, Write, Edit
---

# Log a Dev Pain Point

Append a structured pain-point entry to `docs/dev-pain-points.md` in this repo. The goal is a
reviewable backlog of dev friction the maintainer can fix over time — so entries must be
**specific and actionable**, not vague grumbles.

## Step 1: Capture the pain point

From `$ARGUMENTS` and/or the session, gather:

1. **Title** — short, concrete (e.g. "Re-read schema.ts 3x because line ranges weren't obvious").
2. **Category** — pick one:
   - `tokens` — caused extra token cost (re-reads, large dumps, redundant searches).
   - `time` — slow step or waiting (builds, docker, flaky tests, retries).
   - `clarity` — docs/instructions/CLAUDE.md unclear, missing, or wrong.
   - `tooling` — broken or awkward scripts, env, commands, setup.
3. **What happened** — what you were doing and where the friction hit.
4. **Cost** — rough impact: token estimate, "~N min waiting", or qualitative.
5. **Suggested fix** — the concrete change that would prevent it next time. **Required.**
6. **Context** — files, commands, branch, or Linear issue involved.

If there's genuinely nothing actionable, don't log noise — skip it.

## Step 2: Create the file if missing

If `docs/dev-pain-points.md` does not exist, create it first with this header:

```markdown
# Dev Pain Points Log

Friction hit while developing in this repo — wasted tokens, lost time, unclear docs, awkward
tooling. Reviewed periodically; fixed items move to Resolved. Add entries via `/log-pain-point`.

## Open

<!-- newest entries go directly below this line -->

---

## Resolved
```

## Step 3: Append the entry (newest first)

Insert the entry **directly below** the `<!-- newest entries go directly below this line -->`
marker in the `## Open` section, so newest is on top. Use today's date.

```markdown
### YYYY-MM-DD — <title>
- **Category:** <tokens | time | clarity | tooling>
- **What happened:** <...>
- **Cost:** <...>
- **Suggested fix:** <...>
- **Context:** <files / commands / branch / NEB-xxx>
```

## Step 4: Confirm

Report a one-line summary of what was logged. Do **not** ask for approval first — logging is
meant to be cheap and frictionless. Log each distinct pain point as its own entry. If a
near-identical open entry already exists, add a `- **Recurred:** YYYY-MM-DD` line to it instead
of creating a duplicate.

This is a fast, low-ceremony action — capture and move on.
