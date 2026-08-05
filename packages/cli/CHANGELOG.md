# skillwarden

## 0.4.0

### Minor Changes

- 3393329: New `detection-evasion` rule: flags CAPTCHA solving/bypass, anti-bot detection
  evasion, and automation-fingerprint hiding (`navigator.webdriver` spoofing)
  capabilities. Developed against the ClawHub security-signals train split;
  detects 2 previously missed LLM-labeled malicious eval_holdout cases with zero
  new findings across the four real-corpus benchmark repositories.

### Patch Changes

- Updated dependencies [3393329]
  - skillwarden-core@0.4.0

## 0.3.0

### Minor Changes

- 8abc605: Recursive skill discovery (finds nested layouts like `plugins/<name>/skills/*`), `.skillwardenignore` fingerprint suppression with `fingerprint` field in JSON output, and false-positive fixes verified on real public skill repos: keycap emoji sequences, test-fixture passwords, placeholder private-key blocks, `sudo <pkg-manager> install`, and tool-call "MUST call" phrasing are no longer flagged.

### Patch Changes

- aedace6: Scan table output now shows each finding's copyable `ignore:` fingerprint for `.skillwardenignore`, and `--help` includes a quick-start section.
- Updated dependencies [8abc605]
  - skillwarden-core@0.3.0

## 0.2.0

### Minor Changes

- 942081f: Initial release: `skillwarden scan / lock / diff / ci` — six deterministic security rule
  categories for Agent Skills (prompt injection, hidden Unicode, dangerous commands,
  credential leaks, exfiltration, dangerous scripts), lockfile v1 with per-file SHA-256
  drift gating, SARIF output, multi-ecosystem skill discovery, and a composite GitHub
  Action.

### Patch Changes

- Updated dependencies [942081f]
  - skillwarden-core@0.2.0
