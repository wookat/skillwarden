import type { Finding, Rule, Skill } from '../types.js';
import { ADVISORY_DOMAIN_INDEX, ADVISORY_NAME_INDEX } from './advisory-data.js';

const DOMAIN_PATTERNS = [...ADVISORY_DOMAIN_INDEX.entries()].map(([domain, entry]) => ({
  domain,
  entry,
  // Match the domain and its subdomains at a hostname boundary.
  regex: new RegExp(`(?:^|[^a-z0-9.-])(?:[a-z0-9-]+\\.)*${domain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-z0-9-])`, 'i'),
}));

export const knownAdvisoryRule: Rule = {
  id: 'known-advisory',
  description: 'Matches skill names and content indicators against the SkillWarden advisory database of publicly documented malicious skills',
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
    for (const file of skill.files) {
      if (!file.content) continue;
      const lines = file.content.split('\n');
      for (const { domain, entry, regex } of DOMAIN_PATTERNS) {
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i] ?? '';
          if (!regex.test(line)) continue;
          findings.push({
            ruleId: 'known-advisory',
            severity: entry.severity,
            message: `References "${domain}", infrastructure documented in advisory ${entry.id} (${entry.title}): https://github.com/wookat/skillwarden/blob/main/advisories/${entry.id}.json`,
            file: file.path,
            line: i + 1,
            snippet: line.trim().slice(0, 120),
          });
          break; // one finding per domain per file
        }
      }
    }
    return findings;
  },
};
