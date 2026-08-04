# CLI Contract

The committed interface for the `skillwarden` command (npm package `skillwarden`).
Scripts and CI configs may rely on everything documented here; changes are semver-major.

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

### `skillwarden scan [paths...]`

| Flag | Default | Description |
|---|---|---|
| `--format <table\|json\|sarif>` | `table` | Output format |
| `-o, --output <file>` | stdout | Write output to a file |
| `--fail-on <low\|medium\|high\|critical>` | `high` | Findings at/above this severity exit 1 |

JSON output: array of `{ skill, path, findings: [{ ruleId, severity, message, file, line?, snippet? }] }`.
SARIF output: SARIF 2.1.0, suitable for GitHub code scanning upload.

### `skillwarden lock [paths...]`

Writes `skillwarden.lock` ([spec](lockfile-v1.md)). `-o, --output <file>` overrides the path.

### `skillwarden diff [paths...]`

Compares current content against the lockfile (`--lockfile <file>`, default
`skillwarden.lock`). Human-readable drift report on stdout; exit 1 on drift, 2 when the
lockfile is missing.

### `skillwarden ci [paths...]`

Drift gate + scan gate in one command for CI. Flags: `--lockfile <file>`,
`--fail-on <severity>` (default `high`). A missing lockfile skips the drift gate with
a warning (scan gate still applies).

## Guarantees

- Scanning never executes skill content — files are only read.
- No network access in any subcommand.
- Reports never echo credential values (matches are redacted).
