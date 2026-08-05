# Releasing

Releases are driven by [changesets](https://github.com/changesets/changesets):

1. Every user-visible PR includes a changeset (`pnpm changeset`).
2. The `Release` workflow (push to `main`) opens/updates a "chore: version packages" PR
   that consumes pending changesets and bumps `skillwarden` / `skillwarden-core` together.
3. Merging that PR triggers the same workflow to publish both packages and tag the release.
4. Create/verify the GitHub Release notes for the new tag (summarize CHANGELOG sections).

## npm auth: trusted publishing (OIDC)

The workflow is configured for [npm trusted publishing](https://docs.npmjs.com/trusted-publishers):
`id-token: write` is granted, npm 11 is installed (OIDC requires npm >= 11.5.1), and
`NPM_CONFIG_PROVENANCE=true` attaches provenance attestations.

**External one-time setup (requires the npm account owner, per package):**

1. On npmjs.com → package → Settings → *Trusted Publisher*, add a GitHub Actions publisher:
   - Organization/user: `wookat`
   - Repository: `skillwarden`
   - Workflow filename: `release.yml`
   - Environment: (leave empty)
2. Repeat for both `skillwarden` and `skillwarden-core`.
3. Optionally set the package to "Require two-factor authentication or an automation or
   granular access token" → with trusted publishing, tokens can then be revoked entirely.

Until that is done, the workflow falls back to `secrets.NPM_TOKEN`
(`NODE_AUTH_TOKEN`); a granular token with **bypass 2FA** and read/write access to both
packages is required for new-version publishes. The 0.2.0 and 0.3.0 releases were
published manually by a maintainer with an org token for this reason.

## Manual fallback

```bash
git checkout main && git pull
pnpm install --frozen-lockfile && pnpm build && pnpm test
pnpm --filter "!@skillwarden/site" -r publish --access public --no-git-checks
gh release create v<version> --target main --title "v<version>" --notes "..."
```

## Rollback

npm unpublish is restricted after 72h; prefer `npm deprecate skillwarden@<bad-version> "message"`
and publishing a fixed patch version.
