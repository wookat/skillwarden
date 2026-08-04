import type { Finding, Rule, Skill } from '../types.js';
import { matchPatterns, type PatternSpec } from './rule.js';

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
    pattern: /(curl|wget|scp|rsync|tar)\s+[^\n]{0,120}(~\/\.ssh|~\/\.aws|~\/\.gnupg|\.env\b|id_rsa|credentials\.json)/i,
    severity: 'critical',
    message: 'Network/file command touching key material or credential files',
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
    pattern: /https?:\/\/[^\s"'`]*\b(ngrok\.(io|app|dev)|trycloudflare\.com|serveo\.net|localhost\.run)\b/i,
    severity: 'high',
    message: 'Ephemeral tunnel endpoint — untraceable data destination',
  },
  {
    pattern: /(cat|head|tail|read)\s+[^\n]{0,60}(~\/\.ssh\/|~\/\.aws\/credentials|~\/\.netrc|~\/\.npmrc)/i,
    severity: 'high',
    message: 'Reads credential files outside the skill scope',
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
    }
    return findings;
  },
};
