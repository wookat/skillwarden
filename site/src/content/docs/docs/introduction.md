---
title: Introduction
description: What SkillWarden is, the threat model it addresses, and how the scan → lock → gate → advise loop works.
---

**SkillWarden** scans, locks, and gates your Agent Skills — `npm audit` + lockfile + CI
drift gate for the `SKILL.md` era.

Agent Skills (`SKILL.md`) are executable context: they are injected into your agent's
session, steer its behavior, and often ship scripts the agent runs with your full
privileges. Thousands are published daily across Claude Code, Codex, Gemini CLI,
Cursor, OpenClaw, and 30+ other products — and installing one is `git clone` plus a
copy. SkillWarden is the security gate for that supply chain.

## The loop

| Step | What it does |
|---|---|
| **Scan** | Deterministic, offline analysis of skills: prompt injection & instruction overrides, hidden Unicode (zero-width, bidi, tag characters), dangerous commands, credential leaks, exfiltration vectors, obfuscated bundled scripts |
| **Lock** | Pin every file of every approved skill (per-file SHA-256) into `skillwarden.lock` — rug-pull defense |
| **Gate** | `skillwarden ci` fails CI on any drift from the approved baseline or on findings at your severity threshold |
| **Advise** | Cross-check against a public, structured [Agent Skills advisory database](/docs/advisories/) |

No account, no API key, no LLM, no network: results are reproducible and CI-friendly.

## Guarantees

- Scanning never executes skill content — files are only read.
- No network access in any subcommand.
- Reports never echo credential values (matches are redacted).

## Naming note

The npm package is **`skillwarden`** (the npm name `skillgate` is an unrelated cloud
LLM-audit tool by another author); the installed command is **`skillwarden`**. This
project is not affiliated with skillgate.sh.

## Sister project

SkillWarden mirrors what [AgentGate](https://github.com/wookat/agentgate) does for MCP
servers: the same scan → lock → gate → advise loop, applied to the Agent Skills
ecosystem.
