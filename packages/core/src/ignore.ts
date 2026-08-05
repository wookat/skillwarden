import type { Finding, SkillScanResult } from './types.js';

export const IGNOREFILE_NAME = '.skillwardenignore';

/**
 * Ignore entries are finding fingerprints: `skill:file:ruleId[:line]`, one per
 * line, `#` comments allowed. `*` in any segment matches that whole segment.
 */
export interface IgnoreEntry {
  skill: string;
  file: string;
  ruleId: string;
  line?: string;
}

export function fingerprint(skillName: string, finding: Finding): string {
  return `${skillName}:${finding.file}:${finding.ruleId}${finding.line !== undefined ? `:${finding.line}` : ''}`;
}

export function parseIgnorefile(content: string): IgnoreEntry[] {
  const entries: IgnoreEntry[] = [];
  for (const raw of content.split('\n')) {
    const line = raw.trim();
    if (line === '' || line.startsWith('#')) continue;
    const parts = line.split(':');
    if (parts.length < 3) continue;
    entries.push({ skill: parts[0]!, file: parts[1]!, ruleId: parts[2]!, line: parts[3] });
  }
  return entries;
}

function segMatch(pattern: string, value: string): boolean {
  return pattern === '*' || pattern === value;
}

function isIgnored(skillName: string, finding: Finding, entries: IgnoreEntry[]): boolean {
  return entries.some(
    (e) =>
      segMatch(e.skill, skillName) &&
      segMatch(e.file, finding.file) &&
      segMatch(e.ruleId, finding.ruleId) &&
      (e.line === undefined || segMatch(e.line, String(finding.line ?? ''))),
  );
}

export interface ApplyIgnoresResult {
  results: SkillScanResult[];
  ignoredCount: number;
}

/** Drop findings matched by the ignore entries, reporting how many were dropped. */
export function applyIgnores(results: SkillScanResult[], entries: IgnoreEntry[]): ApplyIgnoresResult {
  if (entries.length === 0) return { results, ignoredCount: 0 };
  let ignoredCount = 0;
  const filtered = results.map((r) => {
    const kept = r.findings.filter((f) => {
      const drop = isIgnored(r.skill.name, f, entries);
      if (drop) ignoredCount++;
      return !drop;
    });
    return kept.length === r.findings.length ? r : { ...r, findings: kept };
  });
  return { results: filtered, ignoredCount };
}
