import { ALL_RULES } from './rules/index.js';
import { SEVERITY_ORDER, type Rule, type Severity, type Skill, type SkillScanResult } from './types.js';

export interface ScanOptions {
  rules?: Rule[];
}

export function scanSkill(skill: Skill, options: ScanOptions = {}): SkillScanResult {
  const rules = options.rules ?? ALL_RULES;
  const findings = rules.flatMap((rule) => rule.check(skill));
  findings.sort((a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity]);
  return { skill, findings };
}

export function scanSkills(skills: Skill[], options: ScanOptions = {}): SkillScanResult[] {
  return skills.map((skill) => scanSkill(skill, options));
}

/** True when any finding meets or exceeds the threshold severity. */
export function hasFindingsAtOrAbove(results: SkillScanResult[], threshold: Severity): boolean {
  const min = SEVERITY_ORDER[threshold];
  return results.some((r) => r.findings.some((f) => SEVERITY_ORDER[f.severity] >= min));
}
