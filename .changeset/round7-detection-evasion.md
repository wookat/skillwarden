---
'skillwarden-core': minor
'skillwarden': minor
---

New `detection-evasion` rule: flags CAPTCHA solving/bypass, anti-bot detection
evasion, and automation-fingerprint hiding (`navigator.webdriver` spoofing)
capabilities. Developed against the ClawHub security-signals train split;
detects 2 previously missed LLM-labeled malicious eval_holdout cases with zero
new findings across the four real-corpus benchmark repositories.
