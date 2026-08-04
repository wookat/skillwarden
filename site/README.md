# SkillWarden docs site

Documentation website for [SkillWarden](https://github.com/wookat/skillwarden), built with
[Astro](https://astro.build) + [Starlight](https://starlight.astro.build), following
the same pattern as the [AgentGate site](https://github.com/wookat/agentgate).

## Develop

From the repo root (the site is a pnpm workspace package, `@skillwarden/site`):

```bash
pnpm install
pnpm --filter @skillwarden/site dev       # dev server at localhost:4321
pnpm --filter @skillwarden/site build     # static build → site/dist
pnpm --filter @skillwarden/site preview   # preview the production build
```

The site is excluded from the root `pnpm build` / `lint` / `typecheck` / `test`
pipeline and builds independently.

## Deploy — Cloudflare Pages

| Setting | Value |
|---|---|
| Framework preset | Astro |
| Build command | `pnpm install && pnpm --filter @skillwarden/site build` |
| Build output directory | `site/dist` |
| Root directory | `/` (repo root — the site depends on the workspace) |
| Node version | 22 (`NODE_VERSION=22` env var) |

Or deploy directly with Wrangler:

```bash
pnpm --filter @skillwarden/site build
npx wrangler pages deploy site/dist --project-name skillwarden
```

Initial deployment target is `skillwarden.pages.dev`; the custom domain
`skillwarden.zalize.com` (configured in `astro.config.mjs` as `site`) will be attached
later via Cloudflare Pages custom domains.

## Structure

- `src/pages/index.astro` — landing page (standalone, Tailwind).
- `src/content/docs/docs/` — Starlight docs content (`/docs/*` routes).
- `astro.config.mjs` — Starlight config and sidebar.
- `src/styles/global.css` — design tokens + Starlight theme mapping.
