# GAP-ROUND-16 — 0.7.0 release regression, competitor recheck, advisory intel

Date: 2026-08-05.

## 1. Scope

Consolidation round after the ROUND-15 install-policy feature: surface the new
capability to users (README, PR #39), verify the released artifact end-to-end,
recheck competitors, and fold new public campaign intelligence into the
advisory database (PR #40).

## 2. 0.7.0 clean-environment regression (`npx skillwarden@0.7.0`)

- `--version` → `0.7.0`; scan/lock/ci full loop green on a clean project.
- `openclaw-install-policy` end-to-end over real stdin:
  - malicious staged skill → `block` with `prompt-injection` +
    `dangerous-commands` findings and `file:line` evidence;
  - benign staged skill → `allow`;
  - non-JSON request → `block` with reason (fail-closed verified in the
    published artifact, not just in tests).
- GitHub Release v0.7.0 published with notes.

## 3. Competitor recheck (2026-08-05, verified)

- **skillgate.sh / npm `skillgate`**: still `0.2.1`, last modified 2026-03-13 —
  six consecutive rounds without an update.
- **ClawScan upstream**: no new commits since `b4d4470` (the state our adapter
  branch is rebased on; go build/vet/test green). Upstream PR still waits on
  the boss account.
- New public research located this round: ATR (Agent Threat Rules) April 2026
  registry scan — folded into SKA-2026-0001 (751 skills, 3 accounts, same C2
  as ClawHavoc). ATR is a rules-engine peer, not a lockfile/gate product; no
  positioning change needed.

## 4. Real-corpus regression (0.7.0 rules)

Unchanged from ROUND-13 baselines: anthropics-skills 6, superpowers 0,
agents 14, claude-code 5 findings. No false-positive drift.

## 5. Honest answer to the loop question

Install-time gating now exists and is verified in the shipped artifact — the
one capability gap ClawScan had over us at the host boundary is closed, with a
zero-dependency offline decision instead of a Docker sandbox composition.
Remaining known gaps are unchanged and tracked: 228 semantic-only
SkillTrustBench misses (out of deterministic scope by design), live OpenClaw
Gateway integration test (needs a host environment), and the external waits
(Trusted Publisher, Cloudflare secrets, upstream adapter PR, corpus-smoke
first cron on Monday).

## 6. Next round candidates

- corpus-smoke first scheduled run (Monday 06:17 UTC) — verify artifacts.
- Live Gateway integration once an OpenClaw host is available.
- Periodic advisory sweep cadence (this round found one update-worthy source;
  keep sweeping each round).
