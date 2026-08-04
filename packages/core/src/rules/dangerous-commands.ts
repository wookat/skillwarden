import type { Finding, Rule, Skill } from '../types.js';
import { matchPatterns, type PatternSpec } from './rule.js';

/**
 * Destructive or remote-code-execution shell patterns, whether they appear in
 * SKILL.md instructions (the agent will run them) or in bundled scripts.
 */
const SPECS: PatternSpec[] = [
  {
    pattern: /rm\s+(-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r)[a-z]*\s+(\/|~|\$HOME)(?![\w./-])/i,
    severity: 'critical',
    message: 'Recursive force-delete of a root or home path',
  },
  {
    pattern: /(curl|wget)\s+[^|;\n]*\|\s*(sudo\s+)?(ba|z|da)?sh\b/i,
    severity: 'critical',
    message: 'Pipe-to-shell of remote content (curl|bash) — unauditable remote code execution',
  },
  {
    pattern: /(curl|wget)\s+[^|;\n]*\|\s*(sudo\s+)?python3?\b/i,
    severity: 'critical',
    message: 'Pipe-to-interpreter of remote content — unauditable remote code execution',
  },
  {
    pattern: /base64\s+(-d|--decode)[^|;\n]*\|\s*(ba|z|da)?sh\b/i,
    severity: 'critical',
    message: 'Decoding base64 into a shell — obfuscated command execution',
  },
  {
    pattern: /\bmkfs(\.\w+)?\s|\bdd\s+[^\n]*of=\/dev\//i,
    severity: 'critical',
    message: 'Disk-destructive command (mkfs / dd to a device)',
  },
  {
    pattern: /chmod\s+(-[a-z]+\s+)?(777|a\+rwx)\b/i,
    severity: 'medium',
    message: 'World-writable permissions (chmod 777)',
  },
  {
    pattern: /\bsudo\s+(?!-h\b)/,
    severity: 'medium',
    message: 'Privilege escalation via sudo inside a skill',
  },
  {
    pattern: /(history\s+-c|shred\s+|unset\s+HISTFILE|>\s*~\/\.(bash|zsh)_history)/i,
    severity: 'high',
    message: 'Shell-history tampering / anti-forensics',
  },
  {
    pattern: /git\s+push\s+[^\n]*(--force\b|-f\b)[^\n]*\b(main|master)\b/i,
    severity: 'high',
    message: 'Force-push to a protected branch',
  },
  {
    pattern: /(nc|ncat|netcat)\s+[^\n]*-e\s*(\/bin\/)?(ba)?sh|(ba)?sh\s+-i\s+>&?\s*\/dev\/tcp\//i,
    severity: 'critical',
    message: 'Reverse-shell pattern',
  },
  {
    pattern: /crontab\s+-|\/etc\/cron|systemctl\s+enable/i,
    severity: 'medium',
    message: 'Persistence mechanism (cron / systemd) installed by a skill',
  },
];

export const dangerousCommandsRule: Rule = {
  id: 'dangerous-commands',
  description: 'Detects destructive, RCE, persistence, and anti-forensics shell patterns',
  check(skill: Skill): Finding[] {
    const findings: Finding[] = [];
    for (const file of skill.files) {
      findings.push(...matchPatterns('dangerous-commands', file, SPECS));
    }
    return findings;
  },
};
