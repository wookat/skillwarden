---
'skillwarden-core': patch
'skillwarden': patch
---

Backfill `indicators.domains` for five more advisories (ClawHavoc
`app-distribution.net`, zaycv `setup-service.com`, roin-orca
`vercel-find-skills.io`, brand-landingpage `stitch-design.ai` /
`google-stitch.com`, Eng0AI takeover `eng0ai-sdk.vercel.app`) — the
`known-advisory` rule now matches 7 verified attacker-controlled campaign
domains in skill content, so renamed clones of these documented campaigns are
still flagged. Zero new findings on the four real reference corpora.
