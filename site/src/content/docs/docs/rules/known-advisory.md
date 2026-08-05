---
title: known-advisory
description: Flags skills whose name matches a publicly documented malicious skill in the bundled advisory database.
---

Malicious skills get re-uploaded, cloned, and typosquatted. This rule matches
each scanned skill's name (frontmatter `name`, falling back to the directory
name) against the [SkillWarden advisory database](/docs/advisories/) of
publicly documented malicious skills — the same model as `npm audit` or
`osv-scanner`, applied to Agent Skills. The database ships inside the package,
so matching works fully offline.

## What it checks

- The skill name, lowercased, against every non-generic skill name recorded in
  a published `SKA-*` advisory. The finding severity is the advisory's
  severity.
- Names an ordinary skill could plausibly use (`update`, `simple`, `clawhub`,
  …) are marked `genericName` in the advisory data and excluded from matching
  to avoid false positives.

This is a **name-based** match: it proves the name collides with a documented
malicious skill, not that the content is identical. Treat it as a
review-immediately signal — check the advisory link in the finding, compare
sources, and if your skill is a legitimate namesake, add the finding's
`ignore:` fingerprint to `.skillwardenignore` after review.

## Example finding

```json
{
  "ruleId": "known-advisory",
  "severity": "critical",
  "message": "Skill name \"better-polymarket\" matches advisory SKA-2026-0004 (better-polymarket / polymarket-all-in-one hide a reverse-shell backdoor inside otherwise working bundled Python code) — name-based match; verify this is not the documented skill: https://github.com/wookat/skillwarden/blob/main/advisories/SKA-2026-0004.json",
  "file": "SKILL.md"
}
```

## Keeping the database current

The name index is generated from `advisories/SKA-*.json` at build time
(`scripts/generate-advisory-data.mjs`); CI fails if it drifts from the
advisory files. New advisories ship with the next package release —
[contributions welcome](https://github.com/wookat/skillwarden/tree/main/advisories).
