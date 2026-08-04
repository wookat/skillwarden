import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import type { Skill } from './types.js';

export const LOCKFILE_NAME = 'skillgate.lock';
export const LOCKFILE_VERSION = 1;

export interface LockedFile {
  path: string;
  sha256: string;
  size: number;
}

export interface LockedSkill {
  name: string;
  /** Skill directory, relative to the lockfile location (POSIX separators). */
  path: string;
  /** Aggregate digest over all locked files (path + content). */
  digest: string;
  description?: string;
  files: LockedFile[];
}

export interface Lockfile {
  version: number;
  generatedAt: string;
  skills: LockedSkill[];
}

function sha256(data: string): string {
  return createHash('sha256').update(data, 'utf8').digest('hex');
}

/** Aggregate digest: sha256 over sorted `path\0sha256(content)\n` records. */
export function skillDigest(files: LockedFile[]): string {
  const records = [...files]
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
    .map((f) => `${f.path}\0${f.sha256}\n`)
    .join('');
  return sha256(records);
}

export function lockSkill(skill: Skill, relPath: string): LockedSkill {
  const files: LockedFile[] = skill.files.map((f) => ({
    path: f.path,
    sha256: sha256(f.content),
    size: f.size,
  }));
  files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return {
    name: skill.name,
    path: relPath,
    digest: skillDigest(files),
    ...(skill.frontmatter.description ? { description: skill.frontmatter.description } : {}),
    files,
  };
}

export function buildLockfile(entries: { skill: Skill; relPath: string }[]): Lockfile {
  const skills = entries.map(({ skill, relPath }) => lockSkill(skill, relPath));
  skills.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return {
    version: LOCKFILE_VERSION,
    generatedAt: new Date().toISOString(),
    skills,
  };
}

export function writeLockfile(path: string, lockfile: Lockfile): void {
  writeFileSync(path, `${JSON.stringify(lockfile, null, 2)}\n`, 'utf8');
}

export function readLockfile(path: string): Lockfile {
  const raw = JSON.parse(readFileSync(path, 'utf8')) as Lockfile;
  if (typeof raw !== 'object' || raw === null || raw.version !== LOCKFILE_VERSION || !Array.isArray(raw.skills)) {
    throw new Error(`Unsupported or corrupt lockfile at ${path} (expected version ${LOCKFILE_VERSION})`);
  }
  return raw;
}
