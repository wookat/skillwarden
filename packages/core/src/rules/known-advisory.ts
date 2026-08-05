import type { Finding, Rule, Skill } from '../types.js';
import { ADVISORY_NAME_INDEX } from './advisory-data.js';

export const knownAdvisoryRule: Rule = {
  id: 'known-advisory',
  description: 'Matches skill names against the SkillWarden advisory database of publicly documented malicious skills',
  check(skill: Skill): Finding[] {
    const names = new Set<string>();
    names.add(skill.name.toLowerCase());
    const frontmatterName = skill.frontmatter.name?.toLowerCase();
    if (frontmatterName) names.add(frontmatterName);
    const findings: Finding[] = [];
    for (const name of names) {
      const entry = ADVISORY_NAME_INDEX.get(name);
      if (!entry) continue;
      findings.push({
        ruleId: 'known-advisory',
        severity: entry.severity,
        message: `Skill name "${name}" matches advisory ${entry.id} (${entry.title}) — name-based match; verify this is not the documented skill: https://github.com/wookat/skillwarden/blob/main/advisories/${entry.id}.json`,
        file: 'SKILL.md',
      });
    }
    return findings;
  },
};
