# GAP-ROUND-19 — threat-intel indicator backfill + post-0.7.2 cycle

Date: 2026-08-04. Basis: real-world intel sweep (public reports), competitor recheck, and post-ROUND-18 regression on the locally built CLI.

## 1. What was tested / researched

- **Competitor recheck**: npm `skillgate` still at 0.2.1 (last publish 2026-03-13 — eighth consecutive round with no release). ClawScan upstream: two new features since our last sync (`feat(policy): OpenClaw install policy adapter #35`, `feat(runner): declarative JSON gate policy #34`) plus CI/docs commits; nothing that changes our adapter branch (already rebased on this base in ROUND-16).
- **Threat-intel sweep**: re-read Unit 42's 2026-06-23 ClawHub sweep (five unblocked skills, Feb–May 2026) and cross-checked every named skill against our advisory DB.
- **Regression**: full local gates green (core 123 / cli 12); four-repo real corpus unchanged: anthropics-skills 6 / superpowers 0 / agents 14 / claude-code 5.

## 2. Gap found

All five Unit 42 skills were already covered by SKA-2026-0011..0014 (names in the known-advisory index), **but the two operator-controlled campaign domains named in the report were not machine-matchable**:

| Advisory | Skill | Missing indicator |
| --- | --- | --- |
| SKA-2026-0013 | money-radar | `laosji.net` (mandatory referrals.json fetch, operator-controlled) |
| SKA-2026-0014 | letssendit | `letssendit.fun` (front-running coordination infrastructure) |

Impact: a renamed clone of either campaign that kept its infrastructure would evade the name index. This is precisely the rename-resistance the domain indicators were added for in ROUND-10/11.

Deliberately **not** added: `rentry.co`, `glot.io`, `pump.fun` (legitimate shared platforms abused as intermediaries — would cause false positives), and raw C2 IPs `2.26.75.16` / `91.92.242.30` (the indicator schema is domain-based; bare public-IP endpoints are already flagged by the exfiltration rule).

## 3. Fix (this round)

- SKA-2026-0013 → `indicators.domains: ["laosji.net"]`
- SKA-2026-0014 → `indicators.domains: ["letssendit.fun"]`
- Regenerated advisory data: 65 names, **8 → 10 domains**.
- Verified end-to-end: a fixture skill referencing `laosji.net` now fires `known-advisory` (HIGH, cites SKA-2026-0013); four-repo corpus shows zero new findings (no FP regression).

## 4. Data snapshot (unchanged this round — no rule logic touched)

- SkillTrustBench (pinned 762d538): binary accuracy 0.8168, malicious→clean 228.
- corpus-smoke: still 0 scheduled runs; first cron expected 2026-08-10 06:17 UTC.

## 5. Verdict & next

Failure-path UX reached contract-level quality in ROUND-18 (shipped in #44, releasing as 0.7.2); this round closes the last machine-matchable indicator gap from published 2026 intel. Remaining known gaps are external (Trusted Publisher, Cloudflare secrets, upstream ClawScan PR, live Gateway integration) or semantic (228 SkillTrustBench social-engineering misses, documented in THREAT-MODEL).
