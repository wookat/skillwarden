---
title: CLI reference
description: The committed interface for the skillwarden command — exit codes, skill resolution, and subcommands.
---

The committed interface for the `skillwarden` command (npm package `skillwarden`).
Scripts and CI configs may rely on everything documented here; changes are
semver-major.

## Exit codes (all subcommands)

| Code | Meaning |
|---|---|
| `0` | Clean: no gate failure |
| `1` | Gate failure: findings at/above `--fail-on`, or lockfile drift |
| `2` | Usage or environment error: bad flags, no skills found, missing lockfile for `diff` |

## Skill resolution (positional `[paths...]`)

Each path may be a skill directory (contains `SKILL.md`), a `SKILL.md` file, or a
parent directory whose children are skill directories. With no paths, well-known
directories under the current working directory are discovered: `.claude/skills`,
`.agents/skills`, `.agent/skills`, `.codex/skills`, `.gemini/skills`,
`.opencode/skills`, `.cursor/skills`, `skills`.

## Subcommands

| Command | Purpose |
|---|---|
| [`skillwarden scan`](/docs/cli/scan/) | Deterministic, offline security analysis of skills |
| [`skillwarden lock`](/docs/cli/lock/) | Pin approved skill content into `skillwarden.lock` |
| [`skillwarden diff`](/docs/cli/diff/) | Human-readable drift report against the lockfile |
| [`skillwarden ci`](/docs/cli/ci/) | Drift gate + scan gate in one command for CI |

## Guarantees

- Scanning never executes skill content — files are only read.
- No network access in any subcommand.
- Reports never echo credential values (matches are redacted).
