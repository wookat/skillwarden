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
  { pattern: /\bglpat-[A-Za-z0-9_-]{20,}\b/, severity: 'critical', message: 'GitLab personal access token' },
  { pattern: /\bnpm_[A-Za-z0-9]{36,}\b/, severity: 'critical', message: 'npm access token' },
  { pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/, severity: 'critical', message: 'OpenAI-style secret key' },
  { pattern: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/, severity: 'critical', message: 'Anthropic API key' },
  { pattern: /\bsk_(live|test)_[A-Za-z0-9]{20,}\b/, severity: 'critical', message: 'Stripe secret key' },
  { pattern: /\brk_(live|test)_[A-Za-z0-9]{20,}\b/, severity: 'critical', message: 'Stripe restricted key' },
  { pattern: /\bhf_[A-Za-z0-9]{30,}\b/, severity: 'critical', message: 'Hugging Face access token' },
  { pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/, severity: 'critical', message: 'Slack token' },
  { pattern: /\bAIza[0-9A-Za-z_-]{35}\b/, severity: 'critical', message: 'Google API key' },
  { pattern: /\bdop_v1_[a-f0-9]{60,}\b/, severity: 'critical', message: 'DigitalOcean personal access token' },
  { pattern: /\bSG\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/, severity: 'critical', message: 'SendGrid API key' },
  { pattern: /-----BEGIN\s+(RSA|EC|DSA|OPENSSH|PGP)?\s*PRIVATE\s+KEY(\s+BLOCK)?-----\s*\n\s*(?!\.\.\.|<|-----END)[A-Za-z0-9+/=]{16,}/, severity: 'critical', message: 'Private key block' },
  { pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/, severity: 'high', message: 'Hardcoded JWT' },
  {
    pattern: /\b(password|passwd|api[_-]?key|secret|token)\s*[:=]\s*["'][^"'\s]{8,}["']/i,
    severity: 'medium',
    message: 'Possible hardcoded credential assignment',
  },
];

/** Broad placeholder shapes, applied to the low-confidence assignment pattern. */
const PLACEHOLDER = /(\$\{?[A-Z_]+\}?|<[^>]+>|xxx+|\.\.\.|your[-_ ]|example|placeholder|redacted|123456?|abcdef|foobar|dummy|sample|test[-_]?(key|token|secret|pass(word)?)|changeme|insert|password|passw?d|secret[-_]?value|hunter2|correct[-_ ]?horse|\bmy[-_]|(api|access)[-_]?(key|token)|(production|prod|dev|staging|local)[-_]?(key|token|secret))/i;

/**
 * Shapes a real, randomly generated token effectively cannot contain. Applied to
 * the high-confidence token patterns so documentation examples do not fail a gate
 * while keeping the miss risk for genuine keys negligible.
 */
const OBVIOUS_PLACEHOLDER = /(\$\{?[A-Z_]+\}?|<[^>]+>|xxxx|your[-_ ]?(key|token|secret|api)?|placeholder|redacted|changeme|replace[-_]?me|\.\.\.)/i;

/** Replace the matched secret with a fixed marker, keeping the surrounding line. */
function redact(line: string, secret: string): string {
  const masked = line.split(secret).join('[redacted]');
  return masked.length > 120 ? `${masked.slice(0, 117)}...` : masked;
}

export const credentialLeakRule: Rule = {
  id: 'credential-leak',
  description: 'Detects hardcoded API keys, tokens, private keys, and credential assignments',
  check(skill: Skill): Finding[] {
    const findings: Finding[] = [];
    for (const file of skill.files) {
      for (const spec of SPECS) {
        const regex = new RegExp(spec.pattern.source, `${spec.pattern.flags.replace('g', '')}g`);
        for (const match of file.content.matchAll(regex)) {
          // Documentation placeholders are not leaks.
          const guard = spec.severity === 'medium' ? PLACEHOLDER : OBVIOUS_PLACEHOLDER;
          if (guard.test(match[0])) continue;
          findings.push({
            ruleId: 'credential-leak',
            severity: spec.severity,
            message: `${spec.message} in skill content`,
            file: file.path,
            line: lineOf(file.content, match.index),
            // Never echo the credential itself into reports (they end up in CI logs and SARIF).
            snippet: redact(snippetAt(file.content, match.index, match[0].length), match[0]),
          });
        }
      }
    }
    return findings;
  },
};
