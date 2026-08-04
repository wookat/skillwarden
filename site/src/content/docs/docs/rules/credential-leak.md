---
title: credential-leak
description: Hardcoded cloud, VCS, and AI-provider credentials in skill content — always reported redacted.
---

Skills are shared and copied freely, so an embedded token is both a leak by the author
and bait that a malicious skill can instruct the agent to use. Reports never echo the
matched value — snippets are redacted.

## What it checks

- AWS access key IDs (`AKIA…`), GitHub tokens (`ghp_…`, `github_pat_…`, `gho_…`), npm
  tokens (`npm_…`), OpenAI-style keys (`sk-…`), Anthropic keys (`sk-ant-…`), Slack
  tokens (`xox…`), Google API keys (`AIza…`) — all `critical`.
- Private key blocks (`-----BEGIN … PRIVATE KEY-----`) (`critical`).
- Hardcoded JWTs (`high`).
- Generic hardcoded credential assignments — `password = "…"`, `api_key: "…"`
  (`medium`).

## Example finding

```json
{
  "ruleId": "credential-leak",
  "severity": "critical",
  "message": "AWS access key ID in skill content",
  "file": "SKILL.md",
  "line": 6,
  "snippet": "Use this key: AKIAIOSFOD…[redacted]"
}
```

## Fixing findings

- Remove the literal value and reference an environment variable or OS keychain
  instead (`${MY_TOKEN}`).
- Rotate any credential that was committed — assume it is compromised.
- If a skill *asks the user* to paste a key into chat, treat that as a design flaw:
  secrets entered into model context can be logged or exfiltrated.
