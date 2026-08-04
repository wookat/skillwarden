import type { Finding, Severity, SkillFile } from '../types.js';

export interface PatternSpec {
  pattern: RegExp;
  severity: Severity;
  message: string;
  /** Optional veto: return false to drop a match (e.g. negated phrasing). */
  guard?: (match: string, content: string, index: number) => boolean;
}

/**
 * Phrasing that negates a following verb ("cannot exfiltrate", "never leaks").
 * Checked against the text immediately preceding a match.
 */
const NEGATION_BEFORE =
  /\b(cannot|can'?t|could\s+not|couldn'?t|never|not|n'?t|no|without|prevents?|prevented|preventing|avoids?|avoiding|blocks?|blocked|blocking|refus\w*|must\s+not|do\s+not|don'?t|should\s+not|shouldn'?t|instead\s+of|rather\s+than|protects?\s+against|guards?\s+against)(?:\s+\S{1,20}){0,3}\s*$/i;

/** True when the 60 characters before `index` negate the matched phrase. */
export function isNegated(content: string, index: number): boolean {
  return NEGATION_BEFORE.test(content.slice(Math.max(0, index - 60), index));
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
      if (spec.guard && !spec.guard(match[0], file.content, match.index)) continue;
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

const SCRIPT_EXT =
  /\.(sh|bash|zsh|ksh|csh|fish|py|pyw|js|mjs|cjs|jsx|ts|mts|cts|tsx|rb|pl|pm|php|lua|awk|sed|tcl|r|jl|nu|ps1|psm1|bat|cmd|vbs|applescript|scpt|ipynb)$/i;

/** Documentation-like files: the text the agent reads as instructions. */
const DOC_EXT = /\.(md|mdx|mdc|markdown|txt|text|rst|adoc|json|jsonc|ya?ml|toml)$/i;

export function isScriptFile(path: string): boolean {
  return SCRIPT_EXT.test(path);
}

export function isDocFile(path: string): boolean {
  return DOC_EXT.test(path);
}
