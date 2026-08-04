---
title: GitHub Action
description: Gate your repository's Agent Skills in CI with the SkillGate GitHub Action — one step, no setup.
---

Gate your repository's Agent Skills (`SKILL.md`) in CI: fail on security findings
(prompt injection, hidden Unicode, dangerous commands, credential leaks, exfiltration,
dangerous scripts) and on any drift from the approved `skillgate.lock` baseline.

## Usage

```yaml
# .github/workflows/skill-gate.yml
name: Skill Gate
on:
  push:
    branches: [main]
  pull_request:

jobs:
  skillgate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: wookat/skillgate/packages/action@main
        with:
          fail-on: high        # low | medium | high | critical
```

## Inputs

| Input | Default | Description |
|---|---|---|
| `command` | `ci` | `ci` (drift gate + scan), `scan`, or `diff` |
| `paths` | auto-discover | Space-separated skill paths |
| `fail-on` | `high` | Severity threshold that fails the gate |
| `lockfile` | `skillgate.lock` | Lockfile path |
| `version` | `latest` | `skill-gate` npm version to run |

Requires Node.js 22+ on the runner (present on `ubuntu-latest`).

## Typical workflow

1. Review the skills in your repo, then commit a baseline:
   `skillgate lock && git add skillgate.lock`.
2. Add the workflow above. From then on, any upstream skill change (drift) or any
   finding at/above `fail-on` turns the build red.
3. When a change is legitimate, re-approve with `skillgate lock` and commit the
   updated lockfile.
