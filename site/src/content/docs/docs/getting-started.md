---
title: Getting started
description: Install SkillWarden from source, scan your skills, pin them with a lockfile, and gate drift in CI.
---

## Install

From source today (npm release upcoming — the CLI below is the committed interface):

```bash
git clone https://github.com/wookat/skillwarden.git
cd skillwarden
pnpm install
pnpm build

alias skillwarden="node $PWD/packages/cli/dist/index.js"
```

Requires Node.js 22+.

## Scan

Scan the skills in your project — `.claude/skills`, `.agents/skills`, `.codex/skills`,
`.gemini/skills`, `.opencode/skills`, `.cursor/skills`, `skills/`, and nested layouts
like `plugins/<name>/skills/` are discovered
automatically:

```bash
skillwarden scan                          # auto-discover, terminal table
skillwarden scan path/to/skill            # a single skill (dir or SKILL.md)
skillwarden scan --format json            # machine-readable report
skillwarden scan --format sarif -o report.sarif   # GitHub code scanning
```

Try it on the bundled examples:

```bash
skillwarden scan examples/skills/benign-skill      # exit 0, clean
skillwarden scan examples/skills/malicious-skill   # exit 1, 8 findings
```

## Lock & gate

Pin the skills you reviewed, then gate on drift:

```bash
skillwarden lock                 # write skillwarden.lock (per-file SHA-256)
skillwarden diff                 # exit 1 + readable diff if any skill content changed
skillwarden ci --fail-on high    # CI gate: drift OR high-severity findings → non-zero exit
```

Exit codes: `0` clean, `1` gate failure (drift / findings at `--fail-on`), `2` usage or
environment error — see the [CLI reference](/docs/cli/).

## Gate in CI

Add the [GitHub Action](/docs/github-action/) in one step:

```yaml
# .github/workflows/skillwarden.yml
steps:
  - uses: actions/checkout@v4
  - uses: wookat/skillwarden/packages/action@main
    with:
      fail-on: high
```

## Next steps

- [CLI reference](/docs/cli/) — every subcommand, flag, and exit code.
- [Rule reference](/docs/rules/) — the eight scan rules with example findings.
- [Lockfile spec](/docs/lockfile/) — the `skillwarden.lock` v1 format.
- [Comparison](/docs/comparison/) — how SkillWarden relates to other skill tools.
