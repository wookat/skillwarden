import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildLockfile, diffLockfiles, LOCKFILE_NAME, readLockfile } from 'skill-gate-core';
import { EXIT_GATE_FAILURE, EXIT_OK, EXIT_USAGE_ERROR, resolveSkills } from '../context.js';
import { renderDrift } from '../output.js';

export interface DiffCommandOptions {
  lockfile?: string;
}

export function runDiff(paths: string[], options: DiffCommandOptions, cwd: string): number {
  const lockPath = resolve(cwd, options.lockfile ?? LOCKFILE_NAME);
  if (!existsSync(lockPath)) {
    process.stderr.write(`No lockfile found at ${lockPath}. Run \`skillgate lock\` first.\n`);
    return EXIT_USAGE_ERROR;
  }
  const locked = readLockfile(lockPath);
  const entries = resolveSkills(paths, cwd);
  const current = buildLockfile(entries);
  const report = diffLockfiles(locked, current);
  process.stdout.write(`${renderDrift(report)}\n`);
  return report.drifted ? EXIT_GATE_FAILURE : EXIT_OK;
}
