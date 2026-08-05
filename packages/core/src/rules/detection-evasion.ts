import type { Finding, Rule, Skill } from '../types.js';
import { isNegated, matchPatterns, type PatternSpec } from './rule.js';

/**
 * Capabilities built to defeat human-verification or bot-detection systems:
 * CAPTCHA solving, anti-bot evasion, and automation-fingerprint hiding.
 * A skill shipping these is engineered to act while appearing human, which
 * defeats exactly the controls that would surface it.
 */

/** Docs saying a skill cannot/never does this are not the capability itself. */
const notNegated: NonNullable<PatternSpec['guard']> = (_m, content, index) => !isNegated(content, index);

const CAPTCHA = /\b(captchas?|recaptcha|hcaptcha|geetest|cloudflare\s+turnstile)\b/i;
const DEFEAT = /\b(auto[- ]?solv\w*|solv(?:e[rds]?|ing)|bypass\w*|crack\w*|break(?:er|ing)?|defeat\w*)\b/i;

const SPECS: PatternSpec[] = [
  {
    pattern: new RegExp(`${CAPTCHA.source}[^\\n]{0,60}${DEFEAT.source}|${DEFEAT.source}[^\\n]{0,60}${CAPTCHA.source}`, 'i'),
    severity: 'high',
    message: 'CAPTCHA solving/bypass capability (defeats human verification)',
    guard: notNegated,
  },
  {
    pattern: /\b(anti[- ]?bot|bot[- ]detection|datadome|perimeterx|kasada|akamai\s+bot)\b[^\n]{0,50}\b(evad\w*|evas\w*|bypass\w*|circumvent\w*|defeat\w*|beat\w*|fool\w*)|\b(evad\w*|bypass\w*|circumvent\w*|defeat\w*)\b[^\n]{0,50}\b(anti[- ]?bot|bot[- ]detection)\b/i,
    severity: 'high',
    message: 'Anti-bot detection evasion capability',
    guard: notNegated,
  },
  {
    pattern: /\bhide\w*\b[^\n]{0,40}\b(automation|browser|webdriver)\s+fingerprints?|\bnavigator\.webdriver\b[^\n]{0,60}\b(hide|hidden|mask\w*|spoof\w*|delete|remove|patch\w*|undefined|false)\b|\b(mask\w*|spoof\w*)\b[^\n]{0,40}\b(automation|webdriver)\s*fingerprints?/i,
    severity: 'high',
    message: 'Automation-fingerprint hiding (webdriver/fingerprint spoofing)',
    guard: notNegated,
  },
];

export const detectionEvasionRule: Rule = {
  id: 'detection-evasion',
  description: 'Detects CAPTCHA solving, anti-bot evasion, and automation-fingerprint hiding capabilities',
  check(skill: Skill): Finding[] {
    const findings: Finding[] = [];
    for (const file of skill.files) {
      findings.push(...matchPatterns('detection-evasion', file, SPECS));
    }
    return findings;
  },
};
