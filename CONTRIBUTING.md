# Contributing to SkillWarden

Thanks for your interest in making Agent Skills safer. All contributions — bug
reports, advisories, docs, code — are welcome.

## Ground rules

- Be respectful; we follow the [Code of Conduct](CODE_OF_CONDUCT.md).
- **Security vulnerabilities in SkillWarden itself:** do NOT open a public issue — see
  [SECURITY.md](SECURITY.md) (or GitHub private vulnerability reporting).
- **New skill advisories** (a malicious/compromised Agent Skill you found): open a PR
  against `advisories/` following the schema there, with public sources.

## Development setup

Requires Node.js >= 22 and [pnpm](https://pnpm.io).

```bash
git clone https://github.com/wookat/skillwarden.git
cd skillwarden
pnpm install
pnpm build
pnpm test        # all workspace tests
pnpm lint        # eslint
pnpm typecheck
```

The repo is a pnpm workspace:

| Package | What it is |
|---|---|
| `packages/core` | rule engine + lockfile implementation (`skillwarden-core`) |
| `packages/cli` | the `skillwarden` CLI (npm package `skillwarden`) |
| `packages/action` | GitHub Action wrapper |
| `advisories/` | public advisory database |
| `examples/` | benign + malicious example skills (CI dogfood fixtures) |

## Making changes

1. Fork and create a topic branch from `main`.
2. Keep PRs small and focused; one logical change per PR.
3. Add or update tests for any behavior change. CI must be green
   (`pnpm build && pnpm lint && pnpm typecheck && pnpm test` locally reproduces it).
4. **Cross-cutting interfaces** (CLI exit codes and JSON output, lockfile schema,
   advisory schema) are specified in [docs/spec/](docs/spec/) — update the spec in the
   same PR as the code.
5. Follow the existing code style (enforced by ESLint); no new runtime dependencies
   without discussion in an issue first (`skillwarden-core` is intentionally
   zero-dependency).
6. Write commit messages in imperative mood; reference issues (`Fixes #123`).

## Adding or changing scan rules

Scan rules live in `packages/core/src/rules`. A rule PR should include:

- the rule implementation + unit tests with true-positive and false-positive fixtures;
- a severity rationale (link to a real incident or advisory if possible);
- docs for the rule ID in the rules reference.

## Release process

Releases are cut by maintainers from `main` via changesets (see
[GOVERNANCE.md](GOVERNANCE.md)). Add a changeset (`pnpm changeset`) to any PR with
user-visible changes.
