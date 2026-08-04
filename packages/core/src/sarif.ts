import { ALL_RULES } from './rules/index.js';
import type { Severity, SkillScanResult } from './types.js';

const SARIF_LEVEL: Record<Severity, string> = {
  low: 'note',
  medium: 'warning',
  high: 'error',
  critical: 'error',
};

/** Minimal SARIF 2.1.0 log for GitHub code scanning upload. */
export function toSarif(results: SkillScanResult[], version: string): object {
  return {
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'skillgate',
            informationUri: 'https://github.com/wookat/skillgate',
            version,
            rules: ALL_RULES.map((rule) => ({
              id: rule.id,
              shortDescription: { text: rule.description },
            })),
          },
        },
        results: results.flatMap((result) =>
          result.findings.map((finding) => ({
            ruleId: finding.ruleId,
            level: SARIF_LEVEL[finding.severity],
            message: { text: `[${result.skill.name}] ${finding.message}` },
            properties: { severity: finding.severity },
            locations: [
              {
                physicalLocation: {
                  artifactLocation: {
                    uri: `${result.skill.dir.split('\\').join('/')}/${finding.file}`,
                  },
                  ...(finding.line ? { region: { startLine: finding.line } } : {}),
                },
              },
            ],
          })),
        ),
      },
    ],
  };
}
