---
'skillwarden-core': minor
'skillwarden': minor
---

New `known-advisory` rule: flags skills whose name matches a publicly
documented malicious skill in the bundled SkillWarden advisory database
(20 advisories, 64 non-generic names), fully offline. Finding severity is
inherited from the advisory; generic names (`update`, `simple`, …) are
excluded from matching. Verified against real corpora: detects the documented
`brand-landingpage` skill (SKA-2026-0017) in wshobson/agents with zero other
new findings.
