import type { Finding, Rule, Skill } from '../types.js';
import { lineOf, snippetAt, type PatternSpec } from './rule.js';

/**
 * Hardcoded credentials inside skill content. Skills are shared and copied
 * freely, so an embedded token is both a leak by the author and bait that a
 * malicious skill can instruct the agent to use.
 */
const SPECS: PatternSpec[] = [
  { pattern: /\bAKIA[0-9A-Z]{16}\b/, severity: 'critical', message: 'AWS access key ID' },
  { pattern: /\bghp_[A-Za-z0-9]{36,}\b/, severity: 'critical', message: 'GitHub personal access token' },
  { pattern: /\bgithub_pat_[A-Za-z0-9_]{36,}\b/, severity: 'critical', message: 'GitHub fine-grained token' },
  { pattern: /\bgho_[A-Za-z0-9]{36,}\b/, severity: 'critical', message: 'GitHub OAuth token' },
  { pattern: /\bnpm_[A-Za-z0-9]{36,}\b/, severity: 'critical', message: 'npm access token' },
  { pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/, severity: 'critical', message: 'OpenAI-style secret key' },
  { pattern: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/, severity: 'critical', message: 'Anthropic API key' },
  { pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/, severity: 'critical', message: 'Slack token' },
  { pattern: /\bAIza[0-9A-Za-z_-]{35}\b/, severity: 'critical', message: 'Google API key' },
  { pattern: /-----BEGIN\s+(RSA|EC|DSA|OPENSSH|PGP)?\s*PRIVATE\s+KEY(\s+BLOCK)?-----/, severity: 'critical', message: 'Private key block' },
  { pattern: /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/, severity: 'high', message: 'Hardcoded JWT' },
  {
    pattern: /\b(password|passwd|api[_-]?key|secret|token)\s*[:=]\s*["'][^"'\s]{8,}["']/i,
    severity: 'medium',
    message: 'Possible hardcoded credential assignment',
  },
];

const PLACEHOLDER = /(\$\{?[A-Z_]+\}?|<[^>]+>|xxx+|\.\.\.|your[-_ ]|example|placeholder|redacted|123456)/i;

export const credentialLeakRule: Rule = {
  id: 'credential-leak',
  description: 'Detects hardcoded API keys, tokens, private keys, and credential assignments',
  check(skill: Skill): Finding[] {
    const findings: Finding[] = [];
    for (const file of skill.files) {
      for (const spec of SPECS) {
        const regex = new RegExp(spec.pattern.source, `${spec.pattern.flags.replace('g', '')}g`);
        for (const match of file.content.matchAll(regex)) {
          const context = snippetAt(file.content, match.index, match[0].length);
          if (spec.severity === 'medium' && PLACEHOLDER.test(match[0])) continue;
          findings.push({
            ruleId: 'credential-leak',
            severity: spec.severity,
            message: `${spec.message} in skill content`,
            file: file.path,
            line: lineOf(file.content, match.index),
            // Do not echo the credential itself into reports.
            snippet: context.slice(0, 24) + '…[redacted]',
          });
        }
      }
    }
    return findings;
  },
};
