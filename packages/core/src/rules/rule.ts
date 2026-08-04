import type { Finding, Severity, SkillFile } from '../types.js';

export interface PatternSpec {
  pattern: RegExp;
  severity: Severity;
  message: string;
}

/** Line number (1-based) of a match index within `content`. */
export function lineOf(content: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < content.length; i++) {
    if (content[i] === '\n') line++;
  }
  return line;
}

/** Truncated single-line excerpt around a match, for reports. */
export function snippetAt(content: string, index: number, length: number): string {
  const lineStart = content.lastIndexOf('\n', index) + 1;
  let lineEnd = content.indexOf('\n', index + length);
  if (lineEnd === -1) lineEnd = content.length;
  const line = content.slice(lineStart, lineEnd).trim();
  return line.length > 160 ? `${line.slice(0, 157)}...` : line;
}

/** Run a list of regex specs against a file, producing findings. */
export function matchPatterns(ruleId: string, file: SkillFile, specs: PatternSpec[]): Finding[] {
  const findings: Finding[] = [];
  for (const spec of specs) {
    const regex = new RegExp(spec.pattern.source, spec.pattern.flags.includes('g') ? spec.pattern.flags : `${spec.pattern.flags}g`);
    for (const match of file.content.matchAll(regex)) {
      findings.push({
        ruleId,
        severity: spec.severity,
        message: spec.message,
        file: file.path,
        line: lineOf(file.content, match.index),
        snippet: snippetAt(file.content, match.index, match[0].length),
      });
    }
  }
  return findings;
}

const SCRIPT_EXT = /\.(sh|bash|zsh|py|js|mjs|cjs|ts|mts|cts|rb|pl|ps1|bat|cmd)$/i;

export function isScriptFile(path: string): boolean {
  return SCRIPT_EXT.test(path);
}
