---
title: skillgate ci
description: Drift gate + scan gate in one command for CI.
---

```bash
skillgate ci [paths...]
```

Runs the drift gate ([`diff`](/docs/cli/diff/)) and the scan gate
([`scan`](/docs/cli/scan/)) in one command for CI. Exit `1` on lockfile drift **or**
findings at/above `--fail-on`.

## Flags

| Flag | Default | Description |
|---|---|---|
| `--lockfile <file>` | `skillgate.lock` | Lockfile path |
| `--fail-on <low\|medium\|high\|critical>` | `high` | Severity threshold that fails the gate |

A missing lockfile skips the drift gate with a warning (the scan gate still applies).

## Example workflow step

```yaml
- run: skillgate ci --fail-on high
```

Or use the [GitHub Action](/docs/github-action/) which wraps this command.
