import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import pc from 'picocolors';
import {
  buildLockfile,
  diffLockfiles,
  hasFindingsAtOrAbove,
  LOCKFILE_NAME,
  readLockfile,
  scanSkills,
  type Severity,
} from 'skillwarden-core';
import { EXIT_GATE_FAILURE, EXIT_OK, EXIT_USAGE_ERROR, filterIgnored, resolveSkills } from '../context.js';
import { renderDrift, renderScanTable } from '../output.js';

export interface CiCommandOptions {
  lockfile?: string;
  failOn?: string;
}

const SEVERITIES = new Set(['low', 'medium', 'high', 'critical']);

/** CI gate: fail on lockfile drift OR findings at/above the threshold. */
export function runCi(paths: string[], options: CiCommandOptions, cwd: string): number {
  if (options.failOn && !SEVERITIES.has(options.failOn)) {
    process.stderr.write(`Invalid --fail-on value: ${options.failOn} (expected low|medium|high|critical)\n`);
    return EXIT_USAGE_ERROR;
  }
  const entries = resolveSkills(paths, cwd);
  if (entries.length === 0) {
    process.stderr.write('No skills found to gate.\n');
    return EXIT_USAGE_ERROR;
  }

  let drifted = false;
  const lockPath = resolve(cwd, options.lockfile ?? LOCKFILE_NAME);
  if (existsSync(lockPath)) {
    const report = diffLockfiles(readLockfile(lockPath), buildLockfile(entries));
    process.stdout.write(`${renderDrift(report)}\n\n`);
    drifted = report.drifted;
  } else {
    process.stdout.write(`${pc.yellow('!')} No ${LOCKFILE_NAME} found — drift gate skipped. Run \`skillwarden lock\` to enable it.\n\n`);
  }

  const { results, ignoredCount } = filterIgnored(scanSkills(entries.map((e) => e.skill)), cwd);
  if (ignoredCount > 0) {
    process.stderr.write(`${ignoredCount} finding${ignoredCount > 1 ? 's' : ''} suppressed by .skillwardenignore\n`);
  }
  process.stdout.write(`${renderScanTable(results)}\n`);

  const threshold = (options.failOn ?? 'high') as Severity;
  const failedScan = hasFindingsAtOrAbove(results, threshold);
  if (drifted || failedScan) {
    process.stdout.write(`\n${pc.red(`✗ Gate failed${drifted ? ' (drift)' : ''}${failedScan ? ` (findings ≥ ${threshold})` : ''}`)}\n`);
    return EXIT_GATE_FAILURE;
  }
  process.stdout.write(`\n${pc.green('✓ Gate passed')}\n`);
  return EXIT_OK;
}
