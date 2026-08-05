---
'skillwarden-core': minor
'skillwarden': minor
---

`known-advisory` now also matches advisory content indicators: domains
recorded under `indicators.domains` in an advisory (e.g. `skillpay.me` from
SKA-2026-0020) are flagged when referenced in any skill file, at hostname
boundaries with subdomain support. Catches renamed re-uploads of documented
campaigns that name-based matching misses — verified on the ClawHub holdout
(2 previously-missed SkillPay skills now flagged, zero new false positives on
four real corpora).
