import type { Finding, Rule, Skill } from '../types.js';
import { matchPatterns, type PatternSpec } from './rule.js';

/**
 * Destructive or remote-code-execution shell patterns, whether they appear in
 * SKILL.md instructions (the agent will run them) or in bundled scripts.
 */
const SPECS: PatternSpec[] = [
  {
    // Flag forms: -rf / -fr / -r -f / --recursive --force. Targets: `/`, `/*`, a
    // system top-level directory, `~`, `~/`, `$HOME`, `${HOME}`, `$USERPROFILE`,
    // optionally quoted. Scoped deletions (`rm -rf ./dist`, `rm -rf $HOME/.cache`)
    // deliberately do not match.
    pattern:
      /\brm\s+(?:(?:-[a-z]*(?:r[a-z]*f|f[a-z]*r)[a-z]*|-[a-z]*[rf][a-z]*\s+-[a-z]*[rf][a-z]*|--recursive\s+--force|--force\s+--recursive)\s+)+["']?(?:\/(?:\*|(?:bin|boot|dev|etc|home|lib|opt|private|root|srv|sys|usr|var|Users|Library)\b|(?![\w.\-/]))|(?:~|\$\{?HOME\}?|\$USERPROFILE)\/?(?:\*|(?![\w.\-/])))/i,
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
    pattern: /\b(sh|bash|zsh|ksh|python3?|ruby|perl|node)\s+(-[a-z]+\s+)*(-c\s*)?["']?\$\(\s*(curl|wget)\b/i,
    severity: 'critical',
    message: 'Command substitution of remote content into a shell/interpreter — unauditable RCE',
  },
  {
    pattern: /\b(ba|z|k)?sh\s+(-[a-z]+\s+)*<\(\s*(curl|wget)\b/i,
    severity: 'critical',
    message: 'Process substitution of remote content into a shell — unauditable RCE',
  },
  {
    pattern: /\beval\s+["']?\$\(\s*(curl|wget)\b/i,
    severity: 'critical',
    message: 'eval of downloaded content — unauditable remote code execution',
  },
  {
    pattern:
      /(python3?|node|ruby|perl)\s+-(c|e)\s+["'][^\n]{0,200}?(urlopen|urllib|requests\.get|http\.get|fetch\(|Net::HTTP)[^\n]{0,200}?(exec|eval|system|popen|Function)/i,
    severity: 'critical',
    message: 'Inline interpreter one-liner that downloads and executes code',
  },
  {
    pattern: /base64\s+(-d|-D|--decode)[^|;\n]*\|\s*(ba|z|da)?sh\b/i,
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
    pattern: /\b(sudo|doas)\s+(?!-h\b)/,
    severity: 'medium',
    message: 'Privilege escalation via sudo/doas inside a skill',
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
    pattern:
      /socket\s*\(\s*\)[^\n]{0,80}connect\s*\(|dup2\s*\(\s*s(ock)?\.fileno\s*\(\s*\)\s*,\s*[012]\s*\)|pty\.spawn\s*\(\s*["']\/bin\/(ba)?sh/i,
    severity: 'critical',
    message: 'Reverse-shell pattern (socket + shell/stdio redirection)',
  },
  {
    pattern: /crontab\s+-|\/etc\/cron|systemctl\s+enable/i,
    severity: 'medium',
    message: 'Persistence mechanism (cron / systemd) installed by a skill',
  },
  {
    pattern: /Library\/Launch(Agents|Daemons)\b|launchctl\s+(load|bootstrap)\b/,
    severity: 'high',
    message: 'Persistence mechanism (macOS launch agent) installed by a skill',
  },
  {
    pattern: /(>>?\s*"?(~|\$HOME)\/\.(bash_profile|bashrc|zshrc|zprofile|profile)\b|\bcat\s*>>?\s*"?(~|\$HOME)\/\.(bashrc|zshrc|bash_profile|zprofile|profile)\b)/i,
    severity: 'high',
    message: 'Shell startup file modified — persistence across sessions',
  },
  {
    pattern:
      /git\s+config\s+(--\w+\s+)*core\.hooksPath|\b(cp|mv|install|ln|echo|printf|cat|tee|chmod|curl|wget)\b[^\n]{0,100}\.git\/hooks\/|\.git\/hooks\/[\w-]+[^\n]{0,40}(<<|>>?|&&|\|)/i,
    severity: 'high',
    message: 'Git hook installation — code execution on future git operations',
  },
  {
    pattern: /"(pre|post)(install|pack|publish)"\s*:\s*"[^"\n]*(curl|wget|base64|eval|node\s+-e|python)/i,
    severity: 'high',
    message: 'Package lifecycle script wired to run downloaded or dynamic code',
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
