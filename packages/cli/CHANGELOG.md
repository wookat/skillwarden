# skillwarden

## 0.7.3

### Patch Changes

- 6416031: known-advisory: add SKA-2026-0022 (RememberAll / secure-sync — trojanized reminder skill that silently installs a credential-harvesting dropper, per Alice/ActiveFence). exfiltration: new high-severity pattern for data POSTed to a public ntfy.sh topic (dead-drop shape); plain ntfy.sh notification links do not match.
- Updated dependencies [6416031]
  - skillwarden-core@0.7.3

## 0.7.2

### Patch Changes

- 2ea4154: CLI robustness: usage errors now exit 2 as documented (unknown commands/flags previously exited 1, colliding with the gate-failure code); a corrupt `skillwarden.lock` reports "not valid JSON — re-run `skillwarden lock`" instead of a raw JSON parse error; scanning a nonexistent path reports "Path does not exist: …" instead of a raw ENOENT.
- 3d0d5fa: known-advisory: add campaign domain indicators laosji.net (SKA-2026-0013, money-radar affiliate injection) and letssendit.fun (SKA-2026-0014, agentic front-running) so renamed clones of these campaigns are still detected by infrastructure reference.
- 904ad24: prompt-injection: bare Chinese 跳过确认/跳过检查 (e.g. "--force 跳过确认" in CLI help text) now reports at medium instead of critical; explicit bypass phrasing (绕过/规避 + 安全/权限/检查…, or 跳过/关闭/禁用 + quantifier or strong object) stays critical. Fixes a real-world false positive on legitimate Chinese CLI documentation while keeping bypass instructions gate-blocking.
- Updated dependencies [2ea4154]
- Updated dependencies [3d0d5fa]
- Updated dependencies [904ad24]
  - skillwarden-core@0.7.2

## 0.7.1

### Patch Changes

- 5479ff8: known-advisory: add SKA-2026-0021 (DeepSeek-Claw — fake DeepSeek integration skill delivering Remcos RAT on Windows and GhostLoader on macOS/Linux, per Zscaler ThreatLabz). Skills named `deepseek-claw` or referencing `cloudcraftshub.com` now match offline.
- Updated dependencies [5479ff8]
  - skillwarden-core@0.7.1

## 0.7.0

### Minor Changes

- b54c60a: New `skillwarden openclaw-install-policy` command: run SkillWarden as
  OpenClaw's `security.installPolicy.exec` command (protocol v1). Reads the
  staged-install request from stdin, scans the staged skill with the full rule
  engine, and answers `allow`/`warn`/`block` on stdout — install-time gating
  before a skill ever reaches the agent. Fail-closed: invalid requests,
  unreadable staged paths, and paths without a `SKILL.md` are blocked;
  `--block-on` (default `high`) and `--warn-on` (default `medium`) tune the
  thresholds; `.skillwardenignore` applies.

### Patch Changes

- skillwarden-core@0.7.0

## 0.6.0

### Minor Changes

- 82a8eb6: Close the script-channel detection gaps found against SkillTrustBench (5520
  cases): `prompt-injection` now scans bundled scripts (docstrings/comments are
  an instruction channel), `exfiltration` adds credential-file reads through
  language runtimes, secret-keyword env harvesting loops, and bare public-IP
  endpoint constants, `dangerous-commands` adds runtime shell-profile appends
  and interpreter hook variables (PYTHONSTARTUP/LD_PRELOAD/NODE_OPTIONS/…), and
  `dangerous-scripts` adds exec/eval of reversed or re-joined strings.
  SkillTrustBench malicious misses drop 571→415 with +5 clean FPs; the four
  real-world corpora are unchanged except one defensible new signal.
- b9a0beb: Cover the persistence, telemetry and config-poisoning clusters that
  SkillTrustBench still slipped past: skills bundling agent hook/config files
  (`.claude/hooks/`, `settings.json`, `mcp.json`) are flagged, `exfiltration`
  adds host/workspace fingerprint telemetry, disposable free-tier collector
  endpoints and secret-filtered env encoding, `dangerous-commands` adds
  `site-packages` `.pth` persistence, argv-form crontab, detached
  (`nohup`/`setsid`) processes and runtime chmod widening, and
  `dangerous-scripts` adds exec/eval over lists of code strings. RFC 5737
  documentation IP ranges no longer trigger the bare-IP endpoint pattern.
  SkillTrustBench malicious misses 415→228; real-world corpora unchanged.

### Patch Changes

- Updated dependencies [82a8eb6]
- Updated dependencies [b9a0beb]
  - skillwarden-core@0.6.0

## 0.5.0

### Minor Changes

- 726a8d5: `known-advisory` now also matches advisory content indicators: domains
  recorded under `indicators.domains` in an advisory (e.g. `skillpay.me` from
  SKA-2026-0020) are flagged when referenced in any skill file, at hostname
  boundaries with subdomain support. Catches renamed re-uploads of documented
  campaigns that name-based matching misses — verified on the ClawHub holdout
  (2 previously-missed SkillPay skills now flagged, zero new false positives on
  four real corpora).
- a9ffc5f: New `known-advisory` rule: flags skills whose name matches a publicly
  documented malicious skill in the bundled SkillWarden advisory database
  (20 advisories, 64 non-generic names), fully offline. Finding severity is
  inherited from the advisory; generic names (`update`, `simple`, …) are
  excluded from matching. Verified against real corpora: detects the documented
  `brand-landingpage` skill (SKA-2026-0017) in wshobson/agents with zero other
  new findings.

### Patch Changes

- 7f88ac3: Backfill `indicators.domains` for five more advisories (ClawHavoc
  `app-distribution.net`, zaycv `setup-service.com`, roin-orca
  `vercel-find-skills.io`, brand-landingpage `stitch-design.ai` /
  `google-stitch.com`, Eng0AI takeover `eng0ai-sdk.vercel.app`) — the
  `known-advisory` rule now matches 7 verified attacker-controlled campaign
  domains in skill content, so renamed clones of these documented campaigns are
  still flagged. Zero new findings on the four real reference corpora.
- Updated dependencies [726a8d5]
- Updated dependencies [7f88ac3]
- Updated dependencies [a9ffc5f]
  - skillwarden-core@0.5.0

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
