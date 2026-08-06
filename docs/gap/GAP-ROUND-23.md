# GAP-ROUND-23 — Docs sync: ntfy.sh dead-drop pattern (ROUND-22 follow-up)

Date: 2026-08-04
Focus: documentation-consistency walkthrough after the ROUND-22 rule change.

## 1. Gap

ROUND-22 (PR #49) added a new exfiltration pattern (data POSTed to a public
ntfy.sh topic, `high`) and advisory SKA-2026-0022, but the user-facing rule
documentation was not updated in the same PR:

- `site/src/content/docs/docs/rules/exfiltration.md` "What it checks" list did
  not mention the ntfy.sh dead-drop shape.
- `docs/THREAT-MODEL.md` §6 rule-coverage table (`exfiltration` row) did not
  list the new pattern class.

Per project convention (ROUND-14/ROUND-20), rule docs and the threat model must
track the shipped pattern set exactly — stale docs were the P1 class found in
both earlier documentation walkthroughs.

## 2. Fix

- Added the ntfy.sh dead-drop bullet to the exfiltration rule page, including
  the deliberate negative scope (plain ntfy.sh notification links do not match).
- Added "data POSTed to public ntfy.sh topics" to the THREAT-MODEL exfiltration
  coverage row.

No code changes; no changeset (docs only).

## 3. Remaining known gaps

- Unchanged from GAP-ROUND-22 §5 (228 semantic STB false negatives,
  corpus-smoke first run 2026-08-10 06:17 UTC, external infra items).
- Website needs a redeploy after this merges (Cloudflare secrets still
  unconfigured — manual fallback).
