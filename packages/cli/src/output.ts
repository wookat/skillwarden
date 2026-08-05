import Table from 'cli-table3';
import pc from 'picocolors';
import { fingerprint, type DriftReport, type Severity, type SkillScanResult } from 'skillwarden-core';

export function severityLabel(severity: Severity): string {
  switch (severity) {
    case 'critical':
      return pc.bgRed(pc.white(' CRITICAL '));
    case 'high':
      return pc.red('HIGH');
    case 'medium':
      return pc.yellow('MEDIUM');
    case 'low':
      return pc.dim('LOW');
  }
}

export function renderScanTable(results: SkillScanResult[]): string {
  const lines: string[] = [];
  let total = 0;
  for (const result of results) {
    const count = result.findings.length;
    total += count;
    const header = count === 0 ? pc.green('✓ clean') : pc.red(`${count} finding${count > 1 ? 's' : ''}`);
    lines.push(`${pc.bold(result.skill.name)} ${pc.dim(`(${result.skill.dir})`)} — ${header}`);
    if (count > 0) {
      const table = new Table({ head: ['Severity', 'Rule', 'Location', 'Message'], style: { head: ['cyan'] }, wordWrap: true, colWidths: [12, 20, 28, 60] });
      for (const f of result.findings) {
        const detail = [f.message, f.snippet ? pc.dim(f.snippet) : '', pc.dim(`ignore: ${fingerprint(result.skill.name, f)}`)]
          .filter(Boolean)
          .join('\n');
        table.push([severityLabel(f.severity), f.ruleId, f.line ? `${f.file}:${f.line}` : f.file, detail]);
      }
      lines.push(table.toString());
    }
  }
  lines.push('');
  lines.push(
    total === 0
      ? pc.green(`✓ ${results.length} skill${results.length === 1 ? '' : 's'} scanned, no findings`)
      : pc.red(`✗ ${total} finding${total > 1 ? 's' : ''} across ${results.length} skill${results.length === 1 ? '' : 's'}`),
  );
  return lines.join('\n');
}

export function renderDrift(report: DriftReport): string {
  if (!report.drifted) return pc.green('✓ No drift — skills match skillwarden.lock');
  const lines: string[] = [pc.red(`✗ Drift detected in ${report.skills.length} skill${report.skills.length > 1 ? 's' : ''}:`), ''];
  for (const drift of report.skills) {
    const tag = drift.kind === 'added' ? pc.green('+ added') : drift.kind === 'removed' ? pc.red('- removed') : pc.yellow('~ modified');
    lines.push(`${tag}  ${pc.bold(drift.name)} ${pc.dim(`(${drift.path})`)}`);
    for (const change of drift.fileChanges) {
      const mark = change.kind === 'added' ? pc.green('  + ') : change.kind === 'removed' ? pc.red('  - ') : pc.yellow('  ~ ');
      lines.push(`${mark}${change.path}`);
    }
  }
  lines.push('');
  lines.push(pc.dim('Review the changes, then re-approve with: skillwarden lock'));
  return lines.join('\n');
}
