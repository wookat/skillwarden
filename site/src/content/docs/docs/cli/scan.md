---
title: skillwarden scan
description: Deterministic, offline security analysis of Agent Skills, with table, JSON, and SARIF output.
---

```bash
skillwarden scan [paths...]
```

Runs the [six scan rules](/docs/rules/) against every resolved skill. With no paths,
well-known skill directories are [auto-discovered](/docs/cli/#skill-resolution-positional-paths).

## Flags

| Flag | Default | Description |
|---|---|---|
| `--format <table\|json\|sarif>` | `table` | Output format |
| `-o, --output <file>` | stdout | Write output to a file |
| `--fail-on <low\|medium\|high\|critical>` | `high` | Findings at/above this severity exit 1 |

## Output formats

**JSON**: array of `{ skill, path, findings: [{ ruleId, severity, message, file, line?, snippet? }] }`.

**SARIF**: SARIF 2.1.0, suitable for GitHub code scanning upload:

```bash
skillwarden scan --format sarif -o report.sarif
```

## Examples

```bash
skillwarden scan                          # auto-discover, terminal table
skillwarden scan path/to/skill            # a single skill (dir or SKILL.md)
skillwarden scan --format json            # machine-readable report
skillwarden scan --fail-on medium         # stricter gate
```

Exit `0` when clean, `1` when findings at/above `--fail-on` exist, `2` on usage or
environment errors.
