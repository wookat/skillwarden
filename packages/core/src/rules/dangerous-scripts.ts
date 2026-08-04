import type { Finding, Rule, Skill } from '../types.js';
import { isScriptFile, matchPatterns, type PatternSpec } from './rule.js';

/**
 * Suspicious constructs in bundled scripts (scripts/*.sh, *.py, *.js, ...):
 * dynamic code execution, obfuscated payloads, and eval-of-download chains.
 * These run with the user's full privileges when the agent executes them.
 */
const SPECS: PatternSpec[] = [
  {
    pattern: /\beval\s*\(\s*(atob|base64|Buffer\.from|codecs\.decode|bytes\.fromhex)/i,
    severity: 'critical',
    message: 'eval() of decoded payload — obfuscated code execution',
  },
  {
    pattern: /\beval\s+["']?\$\(([^)]*\b(base64|xxd|openssl\s+enc|curl|wget)\b[^)]*)\)/i,
    severity: 'critical',
    message: 'Shell eval of a decoded or downloaded payload',
  },
  {
    pattern: /\bexec\s*\(\s*(compile|base64|__import__|bytes\.fromhex)/i,
    severity: 'critical',
    message: 'Python exec() of dynamic payload',
  },
  {
    pattern: /(new\s+Function|child_process|execSync|spawnSync?)\s*\([^\n)]*\+/,
    severity: 'high',
    message: 'Dynamic command construction passed to an executor',
  },
  {
    pattern: /\b(os\.system|subprocess\.(run|call|Popen))\s*\(\s*f?["'][^"'\n]*\{/,
    severity: 'high',
    message: 'Shell command built by string interpolation (injection risk)',
  },
  {
    pattern: /["'][A-Za-z0-9+/]{200,}={0,2}["']/,
    severity: 'high',
    message: 'Large base64 blob in a script — possible embedded payload',
  },
  {
    pattern: /(\\x[0-9a-f]{2}){20,}/i,
    severity: 'high',
    message: 'Long hex-escape sequence — obfuscated payload',
  },
  {
    pattern: /String\.fromCharCode\s*\((\s*\d+\s*,){10,}/,
    severity: 'high',
    message: 'Char-code obfuscated string construction',
  },
  {
    pattern: /(urllib\.request\.urlopen|requests\.get|fetch|https?\.get)\s*\([^\n)]*\)[^\n]{0,40}(exec|eval|\.run|subprocess|Function)/i,
    severity: 'critical',
    message: 'Download-then-execute chain',
  },
];

export const dangerousScriptsRule: Rule = {
  id: 'dangerous-scripts',
  description: 'Detects dynamic execution, obfuscation, and download-execute chains in bundled scripts',
  check(skill: Skill): Finding[] {
    const findings: Finding[] = [];
    for (const file of skill.files) {
      if (!isScriptFile(file.path)) continue;
      findings.push(...matchPatterns('dangerous-scripts', file, SPECS));
    }
    return findings;
  },
};
