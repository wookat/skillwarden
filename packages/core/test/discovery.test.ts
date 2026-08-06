import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { discoverSkills, loadSkill, loadSkillsFromPath } from '../src/discovery.js';
import { BENIGN_SKILL_MD } from './helpers.js';

function makeProject(): string {
  const root = mkdtempSync(join(tmpdir(), 'skillwarden-proj-'));
  for (const [rel, content] of Object.entries({
    '.claude/skills/deploy/SKILL.md': BENIGN_SKILL_MD,
    '.claude/skills/deploy/scripts/run.sh': 'echo deploy\n',
    '.agents/skills/review/SKILL.md': '---\nname: review\ndescription: Review code\n---\nReview.\n',
    'plugins/sys/skills/rust-async/SKILL.md': '---\nname: rust-async\ndescription: Rust async patterns\n---\nAsync.\n',
    'node_modules/dep/skills/hidden/SKILL.md': '---\nname: hidden\n---\nShould be skipped.\n',
  })) {
    mkdirSync(join(root, rel, '..'), { recursive: true });
    writeFileSync(join(root, rel), content, 'utf8');
  }
  return root;
}

describe('discoverSkills', () => {
  it('finds skills in well-known directories and nested layouts, skipping node_modules', () => {
    const root = makeProject();
    const skills = discoverSkills(root);
    expect(skills.map((s) => s.name).sort()).toEqual(['format-code', 'review', 'rust-async']);
  });
});

describe('loadSkillsFromPath', () => {
  it('loads a single skill dir, a SKILL.md file, and a parent dir', () => {
    const root = makeProject();
    expect(loadSkillsFromPath(join(root, '.claude/skills/deploy'))).toHaveLength(1);
    expect(loadSkillsFromPath(join(root, '.claude/skills/deploy/SKILL.md'))).toHaveLength(1);
    expect(loadSkillsFromPath(join(root, '.claude/skills'))).toHaveLength(1);
  });

  it('recursively finds skills under an arbitrary parent directory', () => {
    const root = makeProject();
    expect(loadSkillsFromPath(join(root, 'plugins')).map((s) => s.name)).toEqual(['rust-async']);
  });

  it('reports a clear error for a nonexistent path', () => {
    expect(() => loadSkillsFromPath('/tmp/skillwarden-does-not-exist')).toThrow(/Path does not exist/);
  });
});

describe('loadSkill', () => {
  it('includes bundled files and uses frontmatter name', () => {
    const root = makeProject();
    const skill = loadSkill(join(root, '.claude/skills/deploy'));
    expect(skill.name).toBe('format-code');
    expect(skill.files.map((f) => f.path)).toEqual(['SKILL.md', 'scripts/run.sh']);
  });

  it('throws when SKILL.md is missing', () => {
    const dir = mkdtempSync(join(tmpdir(), 'skillwarden-empty-'));
    expect(() => loadSkill(dir)).toThrow(/No SKILL.md/);
  });
});
