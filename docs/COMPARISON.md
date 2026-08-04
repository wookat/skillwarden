# Competitive Comparison

> Last verified: 2026-08-04. Every claim below was checked against the competitor's
> public README / repository source code / npm registry metadata on that date (links in
> each section). Star counts are from the GitHub API on the same date and will drift.
> SkillGate is under active development — rows not yet shipped are marked "planned".

## TL;DR

The Agent Skills (`SKILL.md`) tool landscape splits into two camps:

1. **Quality linters** (skill-tools, skill-check, skillmds) — validate structure,
   frontmatter, and quality-score skills. Security is at most one rule out of dozens
   ("no embedded secrets"). **No prompt-injection / hidden-Unicode / malicious-command
   analysis, no lockfile, no drift gate.**
2. **Security scanners** (Snyk Agent Scan, loris-fo/skillgate) — do analyze skills for
   injection and malware, but both require external services (Snyk account + token;
   skillgate.sh cloud LLM audit via the Anthropic API), are non-deterministic or
   cloud-gated, and have **no lockfile and no CI drift gate**: a skill you approved
   last week that quietly changes upstream is invisible to them.

SkillGate's bet: one local, deterministic, offline tool that closes the whole loop —
**scan → lock → gate → advise** — for the skills ecosystem, mirroring what
[AgentGate](https://github.com/wookat/agentgate) does for MCP servers. No competitor
covers more than one of the four.

## Feature matrix

| Capability | SkillGate | [Snyk Agent Scan](https://github.com/snyk/agent-scan) | [loris-fo/skillgate](https://github.com/loris-fo/skillgate) | [skill-tools](https://github.com/skill-tools/skill-tools) | [skill-check](https://github.com/thedaviddias/skill-check) | [skillmds](https://www.npmjs.com/package/skillmds) |
|---|---|---|---|---|---|---|
| Security scan of SKILL.md (prompt injection, override attempts) | ✅ deterministic rules | ✅ (proprietary analysis, Snyk platform) | ✅ (LLM-as-judge via skillgate.sh API) | ❌ | ⚠️ delegates to Snyk agent-scan | ⚠️ basic `scan` |
| Hidden Unicode / invisible character detection | ✅ | ✅ | ⚠️ prompt asks the LLM to look | ❌ | ⚠️ via agent-scan | ❓ unverifiable (closed source, bundled `vendor/index.js`) |
| Bundled script analysis (scripts/*.sh, *.py, *.js) | ✅ | ✅ | ❌ (100KB single-content audit) | ❌ | ⚠️ via agent-scan | ❓ |
| Credential/secret patterns | ✅ | ✅ | ⚠️ LLM judgement | ⚠️ 1 lint rule (embedded secrets) | ✅ own rule + agent-scan | ❓ |
| Works offline / no account / no API key | ✅ | ❌ Snyk account + auth required | ❌ requires skillgate.sh API (Anthropic-backed) | ✅ | ⚠️ lint offline; security scan needs uv + Snyk | ⚠️ CLI local, publish needs skillmd.com |
| Deterministic, reproducible results | ✅ | ⚠️ ML/LLM components | ❌ LLM audit | ✅ | ⚠️ mixed | ❓ |
| Lockfile of skill content (per-file SHA-256) | ✅ `skillgate.lock` | ❌ | ❌ | ❌ | ❌ | ❌ |
| CI drift gate (non-zero exit on upstream change) | ✅ `skillgate ci` | ❌ | ❌ | ❌ | ⚠️ `diff` compares diagnostics of two dirs, not content drift vs a baseline | ❌ |
| Human-readable drift diff | ✅ `skillgate diff` | ❌ | ❌ | ❌ | ⚠️ diagnostics diff only | ❌ |
| Public structured advisory DB + auto cross-check | ✅ `advisories/` | ⚠️ proprietary Snyk intel | ❌ | ❌ | ❌ | ❌ |
| Multi-ecosystem skill dir discovery (.claude/.agents/.codex/.gemini/.opencode/.cursor) | ✅ | ✅ broad harness discovery | ❌ `.claude` only | ⚠️ path input | ✅ paths + GitHub URLs | ⚠️ install targets several |
| Quality lint / scoring | ❌ out of scope (use skill-tools) | ❌ | ❌ | ✅ 20 checks, 10 rules, 0-100 score | ✅ score + autofix | ✅ lint |
| Output formats | table / JSON / SARIF | terminal, experimental CLI | terminal, JSON | terminal, JSON, SARIF | text/JSON/SARIF/HTML | terminal |
| GitHub Action | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Language / runtime | TypeScript / Node 22 | Python (uvx / binary) | TypeScript / Node 18 | TypeScript / Node | TypeScript / Node | TypeScript (closed bundle) |
| License | Apache-2.0 | Apache-2.0 | none published | Apache-2.0 | MIT | none visible |
| GitHub stars (2026-08-04) | — (pre-launch) | 2,859 | 0 | 9 | 188 | n/a (repo not public) |

Legend: ✅ confirmed in their README or source · ⚠️ partial (see notes) · ❌ absent · ❓ closed source, unverifiable.

## Per-competitor notes (what we actually verified)

### Snyk Agent Scan (`snyk/agent-scan`, 2,859★)

- Since 0.4 scans **agent skills** (single SKILL.md, `~/.claude/skills`, machine-wide
  discovery) for prompt injection, sensitive-data handling, and hidden payloads, and
  published a skills-ecosystem threat report — the strongest security competitor.
- Weaknesses vs SkillGate: requires the Snyk platform (account/auth); Python/uvx
  runtime; CLI output "experimental and subject to change" per their README; no
  lockfile, no drift gate, no public advisory DB; scanning MCP configs executes
  commands (their own security warning).

### loris-fo/skillgate (npm `skillgate`, 0★, published 2026-03)

- Same name, same niche — verified by reading its source: the CLI posts skill content
  to `https://skillgate.sh/api`, which runs a **Claude (Anthropic) structured audit**
  (5 categories, safe/warn/critical) with Upstash Redis caching; `install` gates
  installation into `.claude/`, `scan` audits a project. Node >= 18.
- Weaknesses vs SkillGate: cloud dependency (their API + Anthropic; dead service =
  dead tool), non-deterministic LLM verdicts, single-file audits capped at 100KB (no
  bundled-script analysis), `.claude` only, no lockfile/diff/ci, no SARIF, no Action,
  no advisory DB, no license file, zero community. Project appears inactive
  (last push 2026-03-13).
- **Naming consequence**: the bare npm name `skillgate` is taken; we publish as
  `skill-gate` (verified 404 on the registry 2026-08-04), keep the SkillGate brand,
  and state the distinction prominently in the README.

### skill-tools (`skill-tools/skill-tools`, 9★)

- "ESLint + Lighthouse for SKILL.md": 20 spec checks, 10 lint rules, 0-100 quality
  score, BM25 routing, generation from OpenAPI/MCP, watch mode, GitHub Action, SARIF.
- Security surface is exactly one lint rule (embedded secrets) plus a 10-point
  "Security" score dimension. No injection/Unicode/command analysis, no bundled-script
  scanning, no lockfile/gate. Quality tool, not a security tool — complementary.

### skill-check (`thedaviddias/skill-check`, 188★)

- Validator with autofix, scoring, watch, GitHub URLs, HTML reports, Homebrew — the
  most polished quality linter. Its "security scan" is an **integration that shells
  out to Snyk agent-scan** (`security-scan` command; requires uv), inheriting Snyk's
  cloud requirements. `diff` compares diagnostics between two directories — not a
  content-drift gate against a locked baseline. No lockfile, no advisory DB.

### skillmds (npm `skillmds` / skillmd.com)

- MCP server + `skillmd` CLI: lint, scan, search, install, publish against the
  skillmd.com registry. Ships as a **bundled closed `vendor/index.js`** (no public
  source repo found), so scan depth is unverifiable; positioning is
  registry/distribution, not security gating. No lockfile/diff/ci/SARIF/Action.

### Adjacent (not direct competitors)

- **tech-leads-club/agent-skills** (4,982★): curated "secure, validated" skill
  registry — validation happens at their curation time, not in your CI; installing
  from anywhere else is unprotected. A future SkillGate advisory-DB consumer, not a
  gate.
- **AgentGate** (ours): same loop for MCP servers; SkillGate reuses its engineering
  standards and, later, shares the Gate-family advisory infrastructure.

## Honest gaps (where competitors beat SkillGate today)

- **Shipped vs planned**: Snyk, skill-tools, skill-check, skillmds all have working
  releases today; SkillGate is under construction. Re-verify this document against our
  shipped feature set before acceptance.
- **LLM-judge depth**: a good LLM audit (loris-fo, Snyk) can catch semantic attacks
  that deterministic rules miss. SkillGate is deterministic-first by design; an
  optional local-LLM engine is a possible later route.
- **Quality linting**: skill-tools/skill-check do quality far better; we deliberately
  don't compete there and recommend running both.
- **Ecosystem breadth**: Snyk also inventories harnesses and MCP servers; SkillGate
  scopes to skills (AgentGate covers MCP).

## What "winning" requires (acceptance bar)

Per CHARTER §7, SkillGate v1 must ship: scan with ≥6 deterministic rule categories
(prompt-injection, hidden-unicode, dangerous-commands, credential-leak,
dangerous-scripts, exfiltration) at least matching Snyk's documented skills checks in
category coverage; lock + diff + ci (unique in this ecosystem); the advisory DB
(unique); multi-ecosystem discovery; SARIF + GitHub Action; docs site — all offline,
no account, deterministic.
