# Security Policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 0.x (latest minor) | ✅ |

Only the latest published release line receives security fixes.

## Reporting a vulnerability

Please report vulnerabilities privately — do **not** open a public issue.

- Preferred: [GitHub private vulnerability reporting](https://github.com/wookat/skillwarden/security/advisories/new)
- We aim to acknowledge reports within **48 hours** and provide a fix or
  mitigation plan within **7 days** for high/critical issues.

Please include a proof of concept, affected versions, and impact assessment
where possible. We will credit reporters in the advisory unless you prefer
otherwise.

## Scope

- `skillwarden` (CLI) and `skillwarden-core` npm packages
- The GitHub Action in `packages/action` and the workflows in this repository

False negatives in the scanning rules (a threat we should detect but do not)
are welcome as regular issues; false positives too. Bypass techniques that
defeat the lockfile drift gate are treated as vulnerabilities.

## Supply-chain posture

- All GitHub Actions are pinned to full commit SHAs.
- Dependencies are locked via `pnpm-lock.yaml` and installed with
  `--frozen-lockfile` in CI.
- Releases are versioned via changesets and published by a maintainer with a
  scoped npm token; the CI release workflow is configured for npm trusted
  publishing (OIDC + provenance) pending npmjs-side activation — see
  docs/RELEASING.md.
- SkillWarden scans its own example skills in CI (`dogfood` steps).
