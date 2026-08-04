import type { Lockfile, LockedSkill } from './lockfile.js';

export interface FileChange {
  path: string;
  kind: 'added' | 'removed' | 'modified';
}

export interface SkillDrift {
  name: string;
  path: string;
  kind: 'added' | 'removed' | 'modified';
  fileChanges: FileChange[];
}

export interface DriftReport {
  drifted: boolean;
  skills: SkillDrift[];
}

function fileChanges(locked: LockedSkill, current: LockedSkill): FileChange[] {
  const changes: FileChange[] = [];
  const lockedByPath = new Map(locked.files.map((f) => [f.path, f]));
  const currentByPath = new Map(current.files.map((f) => [f.path, f]));
  for (const [path, file] of currentByPath) {
    const prev = lockedByPath.get(path);
    if (!prev) changes.push({ path, kind: 'added' });
    else if (prev.sha256 !== file.sha256) changes.push({ path, kind: 'modified' });
  }
  for (const path of lockedByPath.keys()) {
    if (!currentByPath.has(path)) changes.push({ path, kind: 'removed' });
  }
  changes.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return changes;
}

/** Compare the locked baseline against the current state of the skills. */
export function diffLockfiles(locked: Lockfile, current: Lockfile): DriftReport {
  const drifts: SkillDrift[] = [];
  const lockedByPath = new Map(locked.skills.map((s) => [s.path, s]));
  const currentByPath = new Map(current.skills.map((s) => [s.path, s]));

  for (const [path, skill] of currentByPath) {
    const prev = lockedByPath.get(path);
    if (!prev) {
      drifts.push({ name: skill.name, path, kind: 'added', fileChanges: [] });
    } else if (prev.digest !== skill.digest) {
      drifts.push({ name: skill.name, path, kind: 'modified', fileChanges: fileChanges(prev, skill) });
    }
  }
  for (const [path, skill] of lockedByPath) {
    if (!currentByPath.has(path)) {
      drifts.push({ name: skill.name, path, kind: 'removed', fileChanges: [] });
    }
  }
  drifts.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return { drifted: drifts.length > 0, skills: drifts };
}
