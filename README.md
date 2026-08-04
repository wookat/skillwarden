<div align="center">

# SkillGate

**Scan, lock, and gate your Agent Skills — `npm audit` + lockfile + CI drift gate for the `SKILL.md` era.**

[![CI](https://github.com/wookat/skillgate/actions/workflows/ci.yml/badge.svg)](https://github.com/wookat/skillgate/actions)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Node >= 22](https://img.shields.io/badge/node-%3E%3D22-brightgreen)](package.json)

Sister project of [AgentGate](https://github.com/wookat/agentgate) (the same loop for MCP servers).

</div>

---

Agent Skills (`SKILL.md`) are executable context: they are injected into your agent's
session, steer its behavior, and often ship scripts the agent runs with your full
privileges. Thousands are published daily across Claude Code, Codex, Gemini CLI,
Cursor, OpenClaw, and 30+ other products — and installing one is `git clone` plus a
copy. SkillGate is the security gate for that supply chain:

| Step | What it does |
|---|---|
| **Scan** | Deterministic, offline analysis of skills: prompt injection & instruction overrides, hidden Unicode (zero-width, bidi, tag characters), dangerous commands, credential leaks, exfiltration vectors, obfuscated bundled scripts |
| **Lock** | Pin every file of every approved skill (per-file SHA-256) into `skillgate.lock` — rug-pull defense |
| **Gate** | `skillgate ci` fails CI on any drift from the approved baseline or on findings at your severity threshold |
| **Advise** | Cross-check against a public, structured [Agent Skills advisory database](advisories/) |

No account, no API key, no LLM, no network: results are reproducible and CI-friendly.

> **Naming note:** the npm package is **`skill-gate`** (the bare `skillgate` name is an
> unrelated cloud LLM-audit tool by another author); the installed command is
> **`skillgate`**. This project is not affiliated with skillgate.sh.

## Quick start

From source today (npm release upcoming — the CLI below is the committed interface):

```bash
git clone https://github.com/wookat/skillgate.git
cd skillgate
pnpm install
pnpm build

alias skillgate="node $PWD/packages/cli/dist/index.js"
```

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

Pin the skills you reviewed, then gate on drift:

```bash
skillgate lock                 # write skillgate.lock (per-file SHA-256)
skillgate diff                 # exit 1 + readable diff if any skill content changed
skillgate ci --fail-on high    # CI gate: drift OR high-severity findings → non-zero exit
```

Exit codes: `0` clean, `1` gate failure (drift / findings at `--fail-on`), `2` usage or
environment error — see [docs/spec/cli-contract.md](docs/spec/cli-contract.md).

## CI gate in one step

```yaml
# .github/workflows/skill-gate.yml
steps:
  - uses: actions/checkout@v4
  - uses: wookat/skillgate/packages/action@main
    with:
      fail-on: high
```

See [packages/action](packages/action/README.md) for all inputs.

## Scan rules

Six deterministic rule categories, aligned with real-world skills-ecosystem threats:

| Rule | Catches |
|---|---|
| `prompt-injection` | "ignore previous instructions", concealment ("don't tell the user"), jailbreak roleplay, fake system markers, precedence claims |
| `hidden-unicode` | zero-width characters, bidi controls, Unicode tag block (invisible instruction smuggling), private-use areas |
| `dangerous-commands` | `curl \| bash`, `rm -rf /`, reverse shells, disk-destructive commands, history tampering, persistence via cron/systemd |
| `credential-leak` | hardcoded AWS/GitHub/npm/OpenAI/Anthropic/Slack/Google tokens, private keys, JWTs (reported redacted) |
| `exfiltration` | env secrets in network requests, key-material reads (`~/.ssh`, `~/.aws`), dead-drop endpoints (webhook.site & co), ephemeral tunnels |
| `dangerous-scripts` | eval/exec of decoded payloads, download-then-execute chains, large base64/hex blobs, command injection in bundled scripts |

## Lockfile

`skillgate.lock` (spec: [docs/spec/lockfile-v1.md](docs/spec/lockfile-v1.md)) records
every file of every skill with its SHA-256 plus an aggregate digest per skill. A skill
that changes upstream after you approved it — the classic registry rug-pull — turns CI
red with a per-file diff instead of silently reprogramming your agent.

## How it compares

The quality linters (skill-tools, skill-check, skillmds) validate structure and score
quality; the security scanners (Snyk Agent Scan, skillgate.sh) need cloud accounts or
LLM APIs. Nobody else does content locking or drift gating for skills. Full,
source-verified matrix: [docs/COMPARISON.md](docs/COMPARISON.md).

## Contributing & security

Issues and PRs welcome. To report a vulnerability in SkillGate itself, open a private
security advisory on GitHub. Advisory submissions: see [advisories/README.md](advisories/README.md).

Apache-2.0 © SkillGate contributors.
