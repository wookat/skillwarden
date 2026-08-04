---
title: CI recipes
description: Copy-paste SkillWarden gates for GitHub Actions, GitLab CI, pre-commit, and any generic CI runner.
---

Every recipe below assumes your reviewed skills are pinned with
`skillwarden lock` and `skillwarden.lock` is committed.

## GitHub Actions (one step)

```yaml
# .github/workflows/skillwarden.yml
name: SkillWarden
on: [push, pull_request]
jobs:
  gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: wookat/skillwarden/packages/action@main
        with:
          fail-on: high
```

See [GitHub Action](/docs/github-action/) for all inputs (`command`, `paths`,
`lockfile`, `version`).

## GitHub Actions (plain npx)

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-node@v4
    with:
      node-version: 22
  - run: npx --yes skillwarden ci --fail-on high
```

## GitLab CI

```yaml
skillwarden:
  image: node:22
  script:
    - npx --yes skillwarden ci --fail-on high
```

## pre-commit

```yaml
# .pre-commit-config.yaml
repos:
  - repo: local
    hooks:
      - id: skillwarden
        name: skillwarden ci
        entry: npx --yes skillwarden ci
        language: system
        pass_filenames: false
```

## Any other CI

`skillwarden ci` is a plain Node CLI with a frozen exit-code contract
(`0` clean, `1` gate failure, `2` usage/environment error — see
[CLI overview](/docs/cli/)), so any runner that can execute
`npx skillwarden ci --fail-on high` and honor a non-zero exit works.

## SARIF upload (GitHub code scanning)

```yaml
steps:
  - uses: actions/checkout@v4
  - run: npx --yes skillwarden scan --format sarif -o skillwarden.sarif || true
  - uses: github/codeql-action/upload-sarif@v3
    with:
      sarif_file: skillwarden.sarif
```

The `|| true` keeps the upload step running on findings; gate separately with
`skillwarden ci` if you also want the build to fail.
