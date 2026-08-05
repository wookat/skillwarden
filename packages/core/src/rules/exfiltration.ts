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
    // Environment filtered for secret-looking names and encoded for transport,
    // even when the network call is on a later line.
    pattern: /\b(?:env|printenv)\b[^\n|]{0,20}\|\s*(?:grep|egrep|rg|awk|sed)[^\n]{0,80}(?:key|token|secret|pass|api|cred)[^\n]{0,80}(?:\||\$\()\s*(?:base64|openssl|gzip|xxd|tr)/i,
    severity: 'critical',
    message: 'Environment filtered for secrets and encoded for transport',
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
  {
    // Credential material read through a language runtime rather than a shell
    // command: Path('~/.ssh/id_rsa').read_text(), open('~/.aws/credentials'), fs.readFile(...).
    pattern: new RegExp(
      `(?:open|read_text|readFile(?:Sync)?|Path|File\\.read|IO\\.read)\\s*\\(?[^\\n]{0,40}["'\`](?:${HOME}|\\.)?/?\\.(?:ssh/|aws/|gnupg/|kube/|docker/|config/gh/|netrc|npmrc|pypirc|git-credentials)`,
      'i',
    ),
    severity: 'critical',
    message: 'Credential file read through a language runtime (bypasses shell-command patterns)',
  },
  {
    // Harvesting loop: iterate the environment and keep only secret-looking keys.
    pattern: /(?:os\.environ\.(?:items|keys)\(\)|Object\.(?:entries|keys)\(\s*process\.env\s*\))[^\n]{0,200}["'](?:KEY|TOKEN|SECRET|PASSWORD|CRED|AWS)["']/,
    severity: 'critical',
    message: 'Environment scanned for secret-looking variables — credential harvesting',
  },
  {
    // A bare IPv4 literal assigned as an endpoint/host constant: no scheme, so
    // the raw-IP URL pattern above misses it.
    pattern:
      /\w*(?:endpoint|host|server|url|uri|c2|collector|upstream|target|beacon|remote|addr(?:ess)?)\w*\s*[:=]\s*["'`](?:https?:\/\/)?(?!0\.0\.0\.0|127\.|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.|169\.254\.|192\.0\.2\.|198\.51\.100\.|203\.0\.113\.)\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d+)?[/"'`]/i,
    severity: 'high',
    message: 'Endpoint constant is a bare public IP address — destination identity cannot be reviewed',
  },
  {
    // Throwaway free-tier host whose subdomain is a random hex label: the shape
    // of a disposable collector, not of a named product endpoint.
    pattern: /\b[a-z0-9-]*[0-9a-f]{8,}\.(?:workers\.dev|pages\.dev|vercel\.app|netlify\.app|onrender\.com|deno\.dev|fly\.dev)\b/i,
    severity: 'high',
    message: 'Endpoint on a free-tier host with a random-looking subdomain — disposable collector shape',
  },
  {
    // Host/workspace fingerprint assembled and posted: identifiers the skill has
    // no functional need for.
    pattern:
      /(?:os\.getcwd\(\)|socket\.gethostname\(\)|os\.uname\(\)|platform\.node\(\)|\bhostname\b|\bwhoami\b)[^\n]{0,200}?(?:urlopen|requests\.post|fetch\s*\(|curl\s+-|axios\.post)|(?:urlopen|requests\.post|curl\s+-[a-zA-Z]*d|axios\.post)[^\n]{0,200}?(?:\$\(hostname\)|\$\(whoami\)|socket\.gethostname\(\)|os\.getcwd\(\))/,
    severity: 'high',
    message: 'Host/workspace identifiers sent to a network endpoint — undisclosed fingerprint telemetry',
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
