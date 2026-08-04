# SkillGate Roadmap

Short-cycle iteration (days, not quarters). Order reflects current priority; items ship
as they pass CI + review.

## Now

- Docs site (Astro/Starlight, Cloudflare Pages) — Getting Started, rules reference,
  lockfile spec, comparison.
- Verified advisory entries (`SKA-2026-*`) + threat-model doc.
- Rule-engine hardening from security/QA cross-review (false-negative/false-positive
  fixtures from real-world skills).
- First npm release: `skill-gate` + `skill-gate-core` (changesets, provenance).

## Next

- Coverage ≥80% enforced in CI; JSON/SARIF snapshot contract tests.
- Advisory cross-check at scan time (`skillgate scan --advisories`): flag skills whose
  digest/source matches a published advisory.
- Registry-aware install helper: `skillgate add <source>` = fetch → scan → lock in one
  step.
- Report viewer on the docs site (load a JSON report, shareable, no backend).

## Later

- Binary file digests in lockfile v2.
- Watch mode / pre-commit hook packaging.
- OpenSSF Best Practices badge; demo GIF; ecosystem listings (awesome-agent-skills).

Suggestions welcome — open an issue.
