import { writeFileSync } from 'node:fs';
import { fingerprint, hasFindingsAtOrAbove, scanSkills, toSarif, type Severity } from 'skillwarden-core';
import { EXIT_GATE_FAILURE, EXIT_OK, EXIT_USAGE_ERROR, filterIgnored, resolveSkills } from '../context.js';
import { renderScanTable } from '../output.js';
import { VERSION } from '../version.js';

export interface ScanCommandOptions {
  format: string;
  output?: string;
  failOn?: string;
}

const SEVERITIES = new Set(['low', 'medium', 'high', 'critical']);

export function runScan(paths: string[], options: ScanCommandOptions, cwd: string): number {
  if (options.failOn && !SEVERITIES.has(options.failOn)) {
    process.stderr.write(`Invalid --fail-on value: ${options.failOn} (expected low|medium|high|critical)\n`);
    return EXIT_USAGE_ERROR;
  }
  const entries = resolveSkills(paths, cwd);
  if (entries.length === 0) {
    process.stderr.write('No skills found. Pass a path to a skill directory or run inside a project with a known skills directory (.claude/skills, .agents/skills, ...).\n');
    return EXIT_USAGE_ERROR;
  }
  const { results, ignoredCount } = filterIgnored(scanSkills(entries.map((e) => e.skill)), cwd);
  if (ignoredCount > 0 && options.format === 'table') {
    process.stderr.write(`${ignoredCount} finding${ignoredCount > 1 ? 's' : ''} suppressed by .skillwardenignore\n`);
  }

  let rendered: string;
  switch (options.format) {
    case 'table':
      rendered = renderScanTable(results);
      break;
    case 'json':
      rendered = JSON.stringify(
        results.map((r) => ({
          skill: r.skill.name,
          path: r.skill.dir,
          findings: r.findings.map((f) => ({ ...f, fingerprint: fingerprint(r.skill.name, f) })),
        })),
        null,
        2,
      );
      break;
    case 'sarif':
      rendered = JSON.stringify(toSarif(results, VERSION), null, 2);
      break;
    default:
      process.stderr.write(`Unknown format: ${options.format} (expected table|json|sarif)\n`);
      return EXIT_USAGE_ERROR;
  }
  if (options.output) writeFileSync(options.output, `${rendered}\n`, 'utf8');
  else process.stdout.write(`${rendered}\n`);

  const threshold = (options.failOn ?? 'high') as Severity;
  return hasFindingsAtOrAbove(results, threshold) ? EXIT_GATE_FAILURE : EXIT_OK;
}
