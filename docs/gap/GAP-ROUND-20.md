# GAP-ROUND-20 — docs-vs-implementation consistency audit

Date: 2026-08-04. Method: side-by-side comparison of every CLI `--help` output (scan/lock/diff/ci/openclaw-install-policy) against its docs-site page, plus a sweep of docs pages for claims that drifted from the current implementation.

## 1. What was audited

- All flags, defaults, and exit-code statements on the five CLI doc pages vs the built CLI's `--help` output — **all consistent** (flags, defaults `--fail-on high`, `--block-on high`, `--warn-on medium`, exit codes 0/1/2 match `docs/spec/cli-contract.md` and ROUND-18 behavior).
- Docs-site prose for stale counts/claims.

## 2. Gaps found and fixed

| Location | Stale claim | Fix |
| --- | --- | --- |
| `docs/cli/scan.md` | "Runs the **six** scan rules" | eight (rules index/README already said eight) |
| `docs/getting-started.md` | "the **six** scan rules" | eight |
| `docs/advisories.md` § Status | "The database currently ships the schema and validation pipeline" — written before any entries existed | Now describes the 21 verified advisories, the sources cited, and that names + campaign domains feed the `known-advisory` rule |

The advisories Status section was the worst offender for a new user: the landing page advertises the advisory database as a headline feature while its doc page claimed it was effectively empty.

## 3. Not changed (verified accurate)

- Flag tables on all five CLI pages; decision mapping and fail-closed list on the install-policy page; drift semantics on the diff page; lockfile determinism notes.
- Rule count on rules index, README, and landing page (already "eight").

## 4. Verdict & next

Docs now match implementation everywhere audited. Site builds clean (25 pages). Requires site redeploy after merge (Cloudflare secrets still pending → manual redeploy by lead). Next: corpus-smoke first cron (2026-08-10), 0.7.2 release regression once #45 merges.
