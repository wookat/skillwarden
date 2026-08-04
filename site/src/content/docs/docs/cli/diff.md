---
title: skillgate diff
description: Compare current skill content against the lockfile and report drift.
---

```bash
skillgate diff [paths...]
```

Compares current skill content against the lockfile. Human-readable drift report on
stdout; exit `1` on drift, `2` when the lockfile is missing.

## Flags

| Flag | Default | Description |
|---|---|---|
| `--lockfile <file>` | `skillgate.lock` | Lockfile to compare against |

## Drift semantics

- A skill present in the lockfile but not on disk → **removed** (drift).
- A skill on disk but not in the lockfile → **added** (drift).
- Matching `path` but different `digest` → **modified** (drift), with per-file
  added/removed/modified detail.
- Any drift → exit code 1.

## Example

```bash
skillgate lock examples/skills/benign-skill
skillgate diff examples/skills/benign-skill   # exit 0 — content matches lock
```
