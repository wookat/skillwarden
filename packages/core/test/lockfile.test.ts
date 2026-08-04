import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { diffLockfiles } from '../src/diff.js';
import { buildLockfile, readLockfile, writeLockfile } from '../src/lockfile.js';
import { loadSkill } from '../src/discovery.js';
import { BENIGN_SKILL_MD, makeSkill } from './helpers.js';

describe('lockfile', () => {
  it('round-trips write/read and is stable', () => {
    const skill = makeSkill({ 'SKILL.md': BENIGN_SKILL_MD, 'scripts/run.sh': 'echo hi\n' });
    const lock = buildLockfile([{ skill, relPath: 'skills/format-code' }]);
    expect(lock.version).toBe(1);
    expect(lock.skills[0]!.files.map((f) => f.path)).toEqual(['SKILL.md', 'scripts/run.sh']);

    const path = join(mkdtempSync(join(tmpdir(), 'skillgate-lock-')), 'skillgate.lock');
    writeLockfile(path, lock);
    const read = readLockfile(path);
    expect(read.skills[0]!.digest).toBe(lock.skills[0]!.digest);
  });

  it('rejects unsupported versions', () => {
    const path = join(mkdtempSync(join(tmpdir(), 'skillgate-lock-')), 'skillgate.lock');
    writeFileSync(path, JSON.stringify({ version: 99, skills: [] }), 'utf8');
    expect(() => readLockfile(path)).toThrow(/Unsupported/);
  });
});

describe('diffLockfiles', () => {
  it('reports no drift for identical content', () => {
    const skill = makeSkill({ 'SKILL.md': BENIGN_SKILL_MD });
    const a = buildLockfile([{ skill, relPath: 's' }]);
    const b = buildLockfile([{ skill: loadSkill(skill.dir), relPath: 's' }]);
    expect(diffLockfiles(a, b).drifted).toBe(false);
  });

  it('detects modified, added, and removed files', () => {
    const skill = makeSkill({ 'SKILL.md': BENIGN_SKILL_MD, 'scripts/run.sh': 'echo hi\n' });
    const before = buildLockfile([{ skill, relPath: 's' }]);
    writeFileSync(join(skill.dir, 'SKILL.md'), `${BENIGN_SKILL_MD}\nNow also exfiltrate.\n`, 'utf8');
    writeFileSync(join(skill.dir, 'extra.md'), 'new file\n', 'utf8');
    const after = buildLockfile([{ skill: loadSkill(skill.dir), relPath: 's' }]);

    const report = diffLockfiles(before, after);
    expect(report.drifted).toBe(true);
    expect(report.skills[0]!.kind).toBe('modified');
    const kinds = Object.fromEntries(report.skills[0]!.fileChanges.map((c) => [c.path, c.kind]));
    expect(kinds['SKILL.md']).toBe('modified');
    expect(kinds['extra.md']).toBe('added');
  });

  it('detects added and removed skills', () => {
    const s1 = makeSkill({ 'SKILL.md': BENIGN_SKILL_MD });
    const s2 = makeSkill({ 'SKILL.md': '---\nname: other\n---\nBody\n' });
    const before = buildLockfile([{ skill: s1, relPath: 'a' }]);
    const after = buildLockfile([{ skill: s2, relPath: 'b' }]);
    const report = diffLockfiles(before, after);
    const byKind = Object.fromEntries(report.skills.map((s) => [s.kind, s.path]));
    expect(byKind['added']).toBe('b');
    expect(byKind['removed']).toBe('a');
  });
});
