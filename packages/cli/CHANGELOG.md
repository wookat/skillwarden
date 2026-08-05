# skillwarden

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
