---
title: "Lockfile spec — skillgate.lock v1"
description: The frozen v1 specification for skillgate.lock — structure, fields, aggregate digest, and drift semantics.
---

Status: **v1, frozen.** Any breaking change bumps `version` and ships a migration.

## Purpose

Pin the exact content of every approved Agent Skill so that any upstream change —
a description tweak, an added script, a modified payload — is detected as drift and
fails the CI gate until a human re-approves with [`skillgate lock`](/docs/cli/lock/).

## Location & format

- Default filename: `skillgate.lock`, written to the working directory
  (override with `lock -o` / `diff --lockfile` / `ci --lockfile`).
- JSON, UTF-8, two-space indent, trailing newline. Deterministic: skills and files
  are sorted by code-point order of their paths, so re-locking unchanged content
  produces a byte-identical file except `generatedAt`.

## Structure

```json
{
  "version": 1,
  "generatedAt": "2026-08-04T10:00:00.000Z",
  "skills": [
    {
      "name": "changelog-writer",
      "path": "examples/skills/benign-skill",
      "digest": "3f6c…64 hex chars…",
      "description": "Write a CHANGELOG entry from the commits since the last tag. …",
      "files": [
        { "path": "SKILL.md", "sha256": "9d1e…", "size": 431 }
      ]
    }
  ]
}
```

### Fields

| Field | Type | Notes |
|---|---|---|
| `version` | number | Always `1` for this spec. Readers MUST reject other values. |
| `generatedAt` | string | ISO-8601 timestamp. Informational only; excluded from drift comparison. |
| `skills[].name` | string | Frontmatter `name`, falling back to the skill directory name. |
| `skills[].path` | string | Skill directory relative to the lockfile location, POSIX separators. Identity key for drift matching. |
| `skills[].digest` | string | Aggregate SHA-256 (hex) over the sorted per-file records (below). |
| `skills[].description` | string? | Frontmatter `description`, when present. |
| `skills[].files[].path` | string | File path relative to the skill directory, POSIX separators. |
| `skills[].files[].sha256` | string | SHA-256 (hex) of the file's UTF-8 content. |
| `skills[].files[].size` | number | File size in bytes. |

### Aggregate digest

```text
digest = sha256( concat( for each file sorted by path: path + "\0" + sha256(content) + "\n" ) )
```

Two skills with identical file sets and contents therefore have identical digests
regardless of lock order or timestamps.

### File inclusion

All text files in the skill directory are locked (same set the scanner reads):
markdown, scripts, config formats, and extension-less text files up to 1 MiB each.
`node_modules`, `.git`, `dist`, and `__pycache__` are excluded. Binary files are
excluded (a future spec version may add binary digests).

## Drift semantics (`skillgate diff` / `skillgate ci`)

- A skill present in the lockfile but not on disk → **removed** (drift).
- A skill on disk but not in the lockfile → **added** (drift).
- Matching `path` but different `digest` → **modified** (drift), with per-file
  added/removed/modified detail.
- Any drift → exit code 1.
