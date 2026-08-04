import { describe, expect, it } from 'vitest';
import { parseFrontmatter, stripFrontmatter } from '../src/frontmatter.js';

describe('parseFrontmatter', () => {
  it('parses flat key-value frontmatter', () => {
    const fm = parseFrontmatter('---\nname: deploy\ndescription: Deploy stuff\n---\n# Body\n');
    expect(fm.name).toBe('deploy');
    expect(fm.description).toBe('Deploy stuff');
  });

  it('parses folded block scalars', () => {
    const fm = parseFrontmatter('---\nname: x\ndescription: >-\n  line one\n  line two\n---\n');
    expect(fm.description).toBe('line one line two');
  });

  it('parses quoted values', () => {
    const fm = parseFrontmatter(`---\nname: "quoted name"\n---\n`);
    expect(fm.name).toBe('quoted name');
  });

  it('returns empty object without frontmatter', () => {
    expect(parseFrontmatter('# Just markdown\n')).toEqual({});
  });
});

describe('stripFrontmatter', () => {
  it('removes the frontmatter block', () => {
    expect(stripFrontmatter('---\nname: x\n---\n# Body\n')).toBe('# Body\n');
  });
});
