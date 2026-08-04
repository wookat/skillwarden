import type { Finding, Rule, Skill } from '../types.js';
import { matchPatterns, type PatternSpec } from './rule.js';

/** Home-directory prefixes an exfiltration path can be written with. */
const HOME = '(?:~|\\$HOME|\\$\\{HOME\\}|\\$USERPROFILE)';

/** A `.env` file reference — not `process.env` / `os.environ` member access. */
const DOTENV = '(?<![\\w.])\\.env(?:\\.\\w+)?\\b';

/**
 * Data-exfiltration vectors: sending environment variables, key material, or
 * shell history to network endpoints, and known dead-drop / tunnel services.
 */
const SPECS: PatternSpec[] = [
  {
    pattern: /(curl|wget|fetch|httpx?|requests\.(post|get|put))\s*[^\n]{0,120}(\$\{?[A-Z_]*(KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL)[A-Z_]*\}?|process\.env\.|os\.environ)/i,
    severity: 'critical',
    message: 'Network request carrying environment secrets',
  },
  {
    pattern: new RegExp(
      `\\b(curl|wget|scp|rsync|tar|zip|dig|nslookup)\\s+[^\\n]{0,160}(${HOME}/\\.(ssh|aws|gnupg|config/gh|kube|docker|npmrc|netrc)|${DOTENV}|id_[re][sc]a\\b|credentials\\.json|\\.netrc\\b|\\.npmrc\\b)`,
      'i',
    ),
    severity: 'critical',
    message: 'Network/file command touching key material or credential files',
  },
  {
    pattern: new RegExp(
      `\\b(cat|head|tail|read|base64|gpg|openssl)\\s+[^\\n]{0,80}(${HOME}/\\.(ssh|aws|gnupg|kube|docker)/|${HOME}/\\.(netrc|npmrc|pypirc|git-credentials)\\b)`,
      'i',
    ),
    severity: 'high',
    message: 'Reads credential files outside the skill scope',
  },
  {
    pattern: /\b(env|printenv|set)\s*(\||>)\s*[^\n]{0,80}(curl|wget|nc|http)/i,
    severity: 'critical',
    message: 'Environment dump piped to a network tool',
  },
  {
    pattern: /https?:\/\/[^\s"'`]*\b(webhook\.site|requestbin|pipedream\.net|pastebin\.com\/api|hookbin|beeceptor|interactsh|oastify\.com|burpcollaborator)\b/i,
    severity: 'critical',
    message: 'Known dead-drop / callback-catcher endpoint',
  },
  {
    pattern: /https?:\/\/(discord(app)?\.com|discord\.com)\/api\/webhooks\/|https?:\/\/hooks\.slack\.com\/services\/|https?:\/\/api\.telegram\.org\/bot|https?:\/\/[^\s"'`]*\bglot\.io\/snippets|https?:\/\/api\.github\.com\/gists\b/i,
    severity: 'high',
    message: 'Chat/paste webhook endpoint — common skill exfiltration channel',
  },
  {
    pattern: /https?:\/\/[^\s"'`]*\b(ngrok\.(io|app|dev)|trycloudflare\.com|serveo\.net|localhost\.run)\b/i,
    severity: 'high',
    message: 'Ephemeral tunnel endpoint — untraceable data destination',
  },
  {
    // Remote image whose query string carries data or a template placeholder:
    // the classic markdown pixel beacon. Static badge URLs do not match.
    pattern:
      /!\[[^\]]*\]\(\s*https?:\/\/[^)\s]*[?&][\w.-]{1,24}=[^)\s]{0,40}(\$\{?\w+|\{\{\s*\w+|<[\w ]{1,20}>|%s|\bSECRET\b|\bTOKEN\b|\bKEY\b|\bDATA\b|\bENV\b)/,
    severity: 'high',
    message: 'Markdown image beacon — remote URL whose query string carries data',
  },
  {
    pattern: /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?\//,
    severity: 'medium',
    message: 'Raw-IP URL — endpoint identity cannot be reviewed',
  },
];

export const exfiltrationRule: Rule = {
  id: 'exfiltration',
  description: 'Detects secret/env exfiltration patterns, dead-drop endpoints, and credential-file access',
  check(skill: Skill): Finding[] {
    const findings: Finding[] = [];
    for (const file of skill.files) {
      findings.push(...matchPatterns('exfiltration', file, SPECS));
      if (file.escapesSkillDir) {
        findings.push({
          ruleId: 'exfiltration',
          severity: 'high',
          message: `Symlink escapes the skill directory (target: ${file.linkTarget ?? 'unresolved'}) — reads files the skill does not ship`,
          file: file.path,
        });
      }
    }
    return findings;
  },
};
