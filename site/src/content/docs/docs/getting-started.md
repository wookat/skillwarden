---
title: Getting started
description: Install SkillGate from source, scan your skills, pin them with a lockfile, and gate drift in CI.
---

## Install

From source today (npm release upcoming — the CLI below is the committed interface):

```bash
git clone https://github.com/wookat/skillgate.git
cd skillgate
pnpm install
pnpm build

alias skillgate="node $PWD/packages/cli/dist/index.js"
```

Requires Node.js 22+.

## Scan

Scan the skills in your project — `.claude/skills`, `.agents/skills`, `.codex/skills`,
`.gemini/skills`, `.opencode/skills`, `.cursor/skills`, and `skills/` are discovered
automatically:

```bash
skillgate scan                          # auto-discover, terminal table
skillgate scan path/to/skill            # a single skill (dir or SKILL.md)
skillgate scan --format json            # machine-readable report
skillgate scan --format sarif -o report.sarif   # GitHub code scanning
```

Try it on the bundled examples:

```bash
skillgate scan examples/skills/benign-skill      # exit 0, clean
skillgate scan examples/skills/malicious-skill   # exit 1, 8 findings
```

## Lock & gate

Pin the skills you reviewed, then gate on drift:

```bash
skillgate lock                 # write skillgate.lock (per-file SHA-256)
skillgate diff                 # exit 1 + readable diff if any skill content changed
skillgate ci --fail-on high    # CI gate: drift OR high-severity findings → non-zero exit
```

Exit codes: `0` clean, `1` gate failure (drift / findings at `--fail-on`), `2` usage or
environment error — see the [CLI reference](/docs/cli/).

## Gate in CI

Add the [GitHub Action](/docs/github-action/) in one step:

```yaml
# .github/workflows/skill-gate.yml
steps:
  - uses: actions/checkout@v4
  - uses: wookat/skillgate/packages/action@main
    with:
      fail-on: high
```

## Next steps

- [CLI reference](/docs/cli/) — every subcommand, flag, and exit code.
- [Rule reference](/docs/rules/) — the six scan rules with example findings.
- [Lockfile spec](/docs/lockfile/) — the `skillgate.lock` v1 format.
- [Comparison](/docs/comparison/) — how SkillGate relates to other skill tools.
