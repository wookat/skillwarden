---
title: detection-evasion
description: CAPTCHA solving, anti-bot evasion, and automation-fingerprint hiding capabilities shipped inside skills.
---

Skills engineered to act while appearing human defeat exactly the controls that
would surface them. This rule flags capabilities built to evade
human-verification and bot-detection systems, in `SKILL.md` and bundled files.

## What it checks

- CAPTCHA solving or bypass (reCAPTCHA, hCaptcha, GeeTest, Cloudflare
  Turnstile, slide-puzzle solvers) — `high`.
- Anti-bot detection evasion (Cloudflare, DataDome, PerimeterX, Kasada, Akamai
  Bot Manager) — `high`.
- Automation-fingerprint hiding (`navigator.webdriver` spoofing, browser or
  automation fingerprint masking) — `high`.

Negated or defensive phrasing ("never bypasses CAPTCHAs") is not flagged.

## Example finding

```json
{
  "ruleId": "detection-evasion",
  "severity": "high",
  "message": "CAPTCHA solving/bypass capability (defeats human verification)",
  "file": "SKILL.md",
  "line": 12,
  "snippet": "automatic CAPTCHA solving (slide-puzzle) during login"
}
```

## Fixing findings

- If the skill legitimately needs this capability (e.g. an internal QA harness
  on infrastructure you own), review it and add the finding's fingerprint to
  your [`.skillwardenignore`](/docs/cli/scan/#suppressing-reviewed-findings).
- For anything operating on third-party services, treat this as a genuine
  signal: CAPTCHA bypass and bot-detection evasion violate most services'
  terms and are a staple of scraping/fraud tooling.
