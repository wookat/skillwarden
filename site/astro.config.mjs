// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://skillgate.zalize.com',
  integrations: [
    starlight({
      title: 'SkillGate',
      description:
        'Scan, lock, and gate your Agent Skills — npm audit + lockfile + CI drift gate for the SKILL.md era.',
      logo: {
        src: './src/assets/logo.svg',
        alt: 'SkillGate',
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/wookat/skillgate',
        },
      ],
      customCss: ['./src/styles/global.css'],
      components: {
        Head: './src/components/Head.astro',
      },
      editLink: {
        baseUrl: 'https://github.com/wookat/skillgate/edit/main/site/',
      },
      sidebar: [
        {
          label: 'Getting started',
          items: [
            { label: 'Introduction', slug: 'docs/introduction' },
            { label: 'Getting started', slug: 'docs/getting-started' },
          ],
        },
        {
          label: 'CLI reference',
          items: [
            { label: 'Overview & exit codes', slug: 'docs/cli' },
            { label: 'skillgate scan', slug: 'docs/cli/scan' },
            { label: 'skillgate lock', slug: 'docs/cli/lock' },
            { label: 'skillgate diff', slug: 'docs/cli/diff' },
            { label: 'skillgate ci', slug: 'docs/cli/ci' },
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
            { label: 'Lockfile (skillgate.lock)', slug: 'docs/lockfile' },
          ],
        },
        {
          label: 'CI integration',
          items: [
            { label: 'GitHub Action', slug: 'docs/github-action' },
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
