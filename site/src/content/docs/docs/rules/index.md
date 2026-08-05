---
title: Rule reference
description: The eight SkillWarden scan rules — what each detects, why it matters, and example findings.
---

`skillwarden scan` runs eight deterministic rule categories, aligned with real-world
skills-ecosystem threats. Every rule works offline, never executes skill content, and
produces reproducible results.

| Rule | Catches |
|---|---|
| [`prompt-injection`](/docs/rules/prompt-injection/) | "ignore previous instructions", concealment ("don't tell the user"), jailbreak roleplay, fake system markers, precedence claims |
| [`hidden-unicode`](/docs/rules/hidden-unicode/) | zero-width characters, bidi controls, Unicode tag block (invisible instruction smuggling), private-use areas |
| [`dangerous-commands`](/docs/rules/dangerous-commands/) | `curl \| bash`, `rm -rf /`, reverse shells, disk-destructive commands, history tampering, persistence via cron/systemd |
| [`credential-leak`](/docs/rules/credential-leak/) | hardcoded AWS/GitHub/npm/OpenAI/Anthropic/Slack/Google tokens, private keys, JWTs (reported redacted) |
| [`exfiltration`](/docs/rules/exfiltration/) | env secrets in network requests, key-material reads (`~/.ssh`, `~/.aws`), dead-drop endpoints (webhook.site & co), ephemeral tunnels |
| [`dangerous-scripts`](/docs/rules/dangerous-scripts/) | eval/exec of decoded payloads, download-then-execute chains, large base64/hex blobs, command injection in bundled scripts |
| [`detection-evasion`](/docs/rules/detection-evasion/) | CAPTCHA solving/bypass, anti-bot detection evasion, automation-fingerprint hiding (`navigator.webdriver` spoofing) |
| [`known-advisory`](/docs/rules/known-advisory/) | Skill name or content indicators (documented campaign domains) match a publicly documented malicious skill in the bundled advisory database |

Severities: `critical` > `high` > `medium` > `low`. Gate on them with
`skillwarden scan --fail-on <severity>` or [`skillwarden ci`](/docs/cli/ci/) (default
threshold: `high`).

Every finding carries `ruleId`, `severity`, `message`, `file`, and usually `line` and
a `snippet`. Advisory categories in the [advisory database](/docs/advisories/) mirror
these rule IDs so advisories can be cross-checked at scan time.
