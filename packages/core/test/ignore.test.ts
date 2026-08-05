import { describe, expect, it } from 'vitest';
import { applyIgnores, fingerprint, parseIgnorefile } from '../src/ignore.js';
import { scanSkills } from '../src/scanner.js';
import { makeSkill } from './helpers.js';

const NOISY = `---
name: docs-skill
---

Install with \`curl https://example.com/install.sh | bash\`.
`;

describe('.skillwardenignore', () => {
  it('parses fingerprints and skips comments and malformed lines', () => {
    const entries = parseIgnorefile('# comment\n\ndocs-skill:SKILL.md:dangerous-commands\nbadline\n*:*:credential-leak:12\n');
    expect(entries).toHaveLength(2);
    expect(entries[1]).toEqual({ skill: '*', file: '*', ruleId: 'credential-leak', line: '12' });
  });

  it('suppresses matching findings and counts them', () => {
    const results = scanSkills([makeSkill({ 'SKILL.md': NOISY })]);
    expect(results[0].findings.length).toBeGreaterThan(0);
    const fp = fingerprint('docs-skill', results[0].findings[0]);
    const { results: filtered, ignoredCount } = applyIgnores(results, parseIgnorefile(fp));
    expect(ignoredCount).toBe(1);
    expect(filtered[0].findings.length).toBe(results[0].findings.length - 1);

    const wildcard = applyIgnores(results, parseIgnorefile('*:*:dangerous-commands'));
    expect(wildcard.results[0].findings.some((f) => f.ruleId === 'dangerous-commands')).toBe(false);
  });

  it('does not suppress non-matching findings', () => {
    const results = scanSkills([makeSkill({ 'SKILL.md': NOISY })]);
    const { ignoredCount } = applyIgnores(results, parseIgnorefile('other-skill:SKILL.md:dangerous-commands'));
    expect(ignoredCount).toBe(0);
  });
});
