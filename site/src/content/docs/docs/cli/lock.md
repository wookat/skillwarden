---
title: skillwarden lock
description: Pin every file of every approved skill (per-file SHA-256) into skillwarden.lock.
---

```bash
skillwarden lock [paths...]
```

Writes `skillwarden.lock` ([spec](/docs/lockfile/)) recording every file of every
resolved skill with its SHA-256 plus an aggregate digest per skill. A skill that
changes upstream after you approved it — the classic registry rug-pull — turns CI red
with a per-file diff instead of silently reprogramming your agent.

## Flags

| Flag | Default | Description |
|---|---|---|
| `-o, --output <file>` | `skillwarden.lock` | Override the lockfile path |

## Behavior

- The lockfile is deterministic: skills and files are sorted by code-point order of
  their paths, so re-locking unchanged content produces a byte-identical file except
  `generatedAt`.
- All text files in the skill directory are locked (the same set the scanner reads),
  up to 1 MiB each. `node_modules`, `.git`, `dist`, and `__pycache__` are excluded.

## Example

```bash
skillwarden lock                 # write skillwarden.lock in the working directory
skillwarden diff                 # verify: exit 0, no drift
```
