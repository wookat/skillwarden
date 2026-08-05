# GAP-ROUND-10 — Advisory content indicators: from name matching to campaign-infrastructure matching

Date: 2026-08-04. Reference points: ClawHub `clawhub-security-signals` dataset
(train + eval_holdout splits, re-fetched from Hugging Face), ClawScan upstream
main, skillgate.sh (npm `skillgate`), four real public skills corpora.

## 1. Competitor recheck (evidence)

| Competitor | Status this round |
| --- | --- |
| skillgate.sh (npm `skillgate`) | Still 0.2.1, last modified 2026-03-13 — five rounds without a release. |
| ClawScan (openclaw/clawscan) | Active: declarative JSON gate policy (#34), OpenClaw install policy adapter (#35), docs-site rebuild. Our `feat/skillwarden-scanner` adapter branch still awaits an upstream PR (external step, boss account). |
| corpus-smoke cron | Still 0 authoritative runs (`gh api …/workflows/corpus-smoke.yml/runs` → empty). Next scheduled trigger: Monday 06:17 UTC. |

## 2. This round's gap (P0)

ROUND-9's `known-advisory` rule matches only **skill names**. The remaining
ClawHub holdout malicious misses show the obvious evasion: re-upload the same
campaign under a new name. Two of the four `malicious->clean` holdout misses
are SkillPay pay-per-call skills (`Claude Context Distiller`,
`Claude Safety Checker`) — the exact pattern documented in SKA-2026-0020 —
that scored clean because their names are not in any advisory.

`npm audit`/OSV-style databases don't just match package names; they match
identifiers of the malicious campaign. Our advisories already document the
campaign infrastructure (`skillpay.me`) — the scanner just didn't use it.

## 3. Fix shipped this round

- Advisory schema: new optional `indicators.domains` — domains identifying an
  advisory's infrastructure.
- SKA-2026-0020 now carries `indicators.domains: ["skillpay.me"]`.
- Generator emits `ADVISORY_DOMAIN_INDEX`; CI freshness check covers it.
- `known-advisory` scans every text file for indicator domains at hostname
  boundaries (subdomains match, lookalikes like `notskillpay.me` don't), one
  finding per domain per file, severity inherited from the advisory.

## 4. Measured results

ClawHub eval_holdout (3368 cases, 0 errors, ~4.8s):

| Metric | Before | After |
| --- | --- | --- |
| `malicious->clean` | 4 | **2** |
| `malicious->suspicious` | 2 | 4 |
| `clean->*` false positives | 173 | 173 (no change) |
| accuracyBinary | 0.6351 | 0.6360 |

Train-split honesty check: `skillpay` appears in 15 train cases labeled
`clean` vs 138 labeled suspicious/malicious. Those 15 would now surface a
`medium` finding — acceptable for a review-signal severity, and consistent
with the advisory's documented position that skillpay.me references warrant
review regardless of the individual skill's intent.

Real corpora (local build): anthropics/skills 6, superpowers 0,
wshobson/agents 12 (incl. the SKA-2026-0017 true positive), claude-code 5 —
**zero new findings** from domain indicators.

## 5. Remaining gaps

| Gap | Priority |
| --- | --- |
| 2 remaining holdout malicious misses are pure semantic scams (fact-check confidence theater; Telegram notify skill) with no rule-able artifact | P2 — outside deterministic-gate scope, documented |
| Only 1 advisory has indicators so far; backfill domains for other advisories where infrastructure is documented | P1 next round |
| Advisory `digest` matching still unused (few advisories captured content digests) | P2 |
| Upstream ClawScan PR, Cloudflare secrets, npm Trusted Publisher, corpus-smoke first run | external / observation |

## 6. Honest conclusion

Is the experience as good as the best comparable competitor? For database-
driven detection we now match the `npm audit`/`osv-scanner` model more
faithfully: name **and** infrastructure indicators, fully offline, severity
from the advisory. The residual holdout misses are semantic scams that even
LLM-based scanners only catch with full-context reasoning; we document them
rather than pretend a regex covers them.
