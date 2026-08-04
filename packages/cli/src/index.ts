#!/usr/bin/env node
import { Command } from 'commander';
import { EXIT_USAGE_ERROR } from './context.js';
import { runCi } from './commands/ci.js';
import { runDiff } from './commands/diff.js';
import { runLock } from './commands/lock.js';
import { runScan } from './commands/scan.js';
import { VERSION } from './version.js';

const program = new Command();

program
  .name('skillgate')
  .description('Scan, lock, and gate your Agent Skills (SKILL.md)')
  .version(VERSION);

program
  .command('scan')
  .description('Scan skills for prompt injection, hidden Unicode, dangerous commands, credential leaks, and more')
  .argument('[paths...]', 'skill directories, SKILL.md files, or parent directories (default: auto-discover)')
  .option('--format <format>', 'output format: table | json | sarif', 'table')
  .option('-o, --output <file>', 'write output to a file instead of stdout')
  .option('--fail-on <severity>', 'exit 1 when findings at/above this severity exist (low|medium|high|critical)', 'high')
  .action((paths: string[], options) => {
    process.exitCode = runScan(paths, options, process.cwd());
  });

program
  .command('lock')
  .description('Pin the current content of all skills (per-file SHA-256) into skillgate.lock')
  .argument('[paths...]', 'skill directories or parent directories (default: auto-discover)')
  .option('-o, --output <file>', 'lockfile path (default: skillgate.lock)')
  .action((paths: string[], options) => {
    process.exitCode = runLock(paths, options, process.cwd());
  });

program
  .command('diff')
  .description('Compare current skill content against skillgate.lock; exit 1 on drift')
  .argument('[paths...]', 'skill directories or parent directories (default: auto-discover)')
  .option('--lockfile <file>', 'lockfile path (default: skillgate.lock)')
  .action((paths: string[], options) => {
    process.exitCode = runDiff(paths, options, process.cwd());
  });

program
  .command('ci')
  .description('CI gate: fail on lockfile drift OR findings at/above --fail-on severity')
  .argument('[paths...]', 'skill directories or parent directories (default: auto-discover)')
  .option('--lockfile <file>', 'lockfile path (default: skillgate.lock)')
  .option('--fail-on <severity>', 'severity threshold (low|medium|high|critical)', 'high')
  .action((paths: string[], options) => {
    process.exitCode = runCi(paths, options, process.cwd());
  });

try {
  program.parse();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = EXIT_USAGE_ERROR;
}
