import { resolve } from 'node:path';
import pc from 'picocolors';
import { buildLockfile, LOCKFILE_NAME, writeLockfile } from 'skillwarden-core';
import { EXIT_OK, EXIT_USAGE_ERROR, resolveSkills } from '../context.js';

export interface LockCommandOptions {
  output?: string;
}

export function runLock(paths: string[], options: LockCommandOptions, cwd: string): number {
  const entries = resolveSkills(paths, cwd);
  if (entries.length === 0) {
    process.stderr.write('No skills found to lock.\n');
    return EXIT_USAGE_ERROR;
  }
  const lockfile = buildLockfile(entries);
  const target = resolve(cwd, options.output ?? LOCKFILE_NAME);
  writeLockfile(target, lockfile);
  process.stdout.write(
    `${pc.green('✓')} Locked ${lockfile.skills.length} skill${lockfile.skills.length === 1 ? '' : 's'} (${lockfile.skills.reduce((n, s) => n + s.files.length, 0)} files) into ${target}\n`,
  );
  return EXIT_OK;
}
