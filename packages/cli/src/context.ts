import { existsSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import {
  applyIgnores,
  discoverSkills,
  IGNOREFILE_NAME,
  loadSkillsFromPath,
  parseIgnorefile,
  type Skill,
  type SkillScanResult,
} from 'skillwarden-core';

export const EXIT_OK = 0;
export const EXIT_GATE_FAILURE = 1;
export const EXIT_USAGE_ERROR = 2;

export interface SkillEntry {
  skill: Skill;
  /** Skill dir relative to cwd, POSIX separators. */
  relPath: string;
}

/** Resolve positional paths (or auto-discover) into skills relative to cwd. */
export function resolveSkills(paths: string[], cwd: string): SkillEntry[] {
  const skills: Skill[] =
    paths.length > 0
      ? paths.flatMap((p) => loadSkillsFromPath(resolve(cwd, p)))
      : discoverSkills(cwd);
  const seen = new Set<string>();
  const entries: SkillEntry[] = [];
  for (const skill of skills) {
    if (seen.has(skill.dir)) continue;
    seen.add(skill.dir);
    entries.push({ skill, relPath: relative(cwd, skill.dir).split('\\').join('/') || '.' });
  }
  entries.sort((a, b) => (a.relPath < b.relPath ? -1 : a.relPath > b.relPath ? 1 : 0));
  return entries;
}

/** Filter findings through `.skillwardenignore` in `cwd`, when present. */
export function filterIgnored(
  results: SkillScanResult[],
  cwd: string,
): { results: SkillScanResult[]; ignoredCount: number } {
  const path = resolve(cwd, IGNOREFILE_NAME);
  if (!existsSync(path)) return { results, ignoredCount: 0 };
  return applyIgnores(results, parseIgnorefile(readFileSync(path, 'utf8')));
}
