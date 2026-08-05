// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://skillwarden.zalize.com',
  integrations: [
    starlight({
      title: 'SkillWarden',
      description:
        'Scan, lock, and gate your Agent Skills — npm audit + lockfile + CI drift gate for the SKILL.md era.',
      logo: {
        src: './src/assets/logo.svg',
        alt: 'SkillWarden',
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/wookat/skillwarden',
        },
      ],
      customCss: ['./src/styles/global.css'],
      components: {
        Head: './src/components/Head.astro',
      },
      editLink: {
        baseUrl: 'https://github.com/wookat/skillwarden/edit/main/site/',
      },
      sidebar: [
        {
          label: 'Getting started',
          items: [
            { label: 'Introduction', slug: 'docs/introduction' },
            { label: 'Getting started', slug: 'docs/getting-started' },
            { label: 'FAQ', slug: 'docs/faq' },
          ],
        },
        {
          label: 'CLI reference',
          items: [
            { label: 'Overview & exit codes', slug: 'docs/cli' },
            { label: 'skillwarden scan', slug: 'docs/cli/scan' },
            { label: 'skillwarden lock', slug: 'docs/cli/lock' },
            { label: 'skillwarden diff', slug: 'docs/cli/diff' },
            { label: 'skillwarden ci', slug: 'docs/cli/ci' },
            { label: 'skillwarden openclaw-install-policy', slug: 'docs/cli/openclaw-install-policy' },
          ],
        },
        {
          label: 'Rule reference',
          items: [
            { label: 'Overview', slug: 'docs/rules' },
            { label: 'prompt-injection', slug: 'docs/rules/prompt-injection' },
            { label: 'hidden-unicode', slug: 'docs/rules/hidden-unicode' },
            { label: 'dangerous-commands', slug: 'docs/rules/dangerous-commands' },
            { label: 'credential-leak', slug: 'docs/rules/credential-leak' },
            { label: 'exfiltration', slug: 'docs/rules/exfiltration' },
            { label: 'dangerous-scripts', slug: 'docs/rules/dangerous-scripts' },
          ],
        },
        {
          label: 'Specifications',
          items: [
            { label: 'Lockfile (skillwarden.lock)', slug: 'docs/lockfile' },
          ],
        },
        {
          label: 'CI integration',
          items: [
            { label: 'GitHub Action', slug: 'docs/github-action' },
            { label: 'CI recipes', slug: 'docs/ci-recipes' },
          ],
        },
        {
          label: 'Advisory database',
          items: [{ label: 'Advisories', slug: 'docs/advisories' }],
        },
        {
          label: 'Ecosystem',
          items: [{ label: 'Comparison', slug: 'docs/comparison' }],
        },
      ],
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
