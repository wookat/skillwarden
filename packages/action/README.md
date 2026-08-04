# SkillWarden GitHub Action

Gate your repository's Agent Skills (`SKILL.md`) in CI: fail on security findings
(prompt injection, hidden Unicode, dangerous commands, credential leaks, exfiltration,
dangerous scripts) and on any drift from the approved `skillwarden.lock` baseline.

## Usage

```yaml
# .github/workflows/skillwarden.yml
name: Skill Gate
on:
  push:
    branches: [main]
  pull_request:

jobs:
  skillwarden:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: wookat/skillwarden/packages/action@main
        with:
          fail-on: high        # low | medium | high | critical
```

## Inputs

| Input | Default | Description |
|---|---|---|
| `command` | `ci` | `ci` (drift gate + scan), `scan`, or `diff` |
| `paths` | auto-discover | Space-separated skill paths |
| `fail-on` | `high` | Severity threshold that fails the gate |
| `lockfile` | `skillwarden.lock` | Lockfile path |
| `version` | `latest` | `skillwarden` npm version to run |

Requires Node.js 22+ on the runner (present on `ubuntu-latest`).
