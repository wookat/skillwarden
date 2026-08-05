import type { Rule } from '../types.js';
import { credentialLeakRule } from './credential-leak.js';
import { dangerousCommandsRule } from './dangerous-commands.js';
import { dangerousScriptsRule } from './dangerous-scripts.js';
import { detectionEvasionRule } from './detection-evasion.js';
import { exfiltrationRule } from './exfiltration.js';
import { hiddenUnicodeRule } from './hidden-unicode.js';
import { promptInjectionRule } from './prompt-injection.js';

export const ALL_RULES: Rule[] = [
  promptInjectionRule,
  hiddenUnicodeRule,
  dangerousCommandsRule,
  credentialLeakRule,
  exfiltrationRule,
  dangerousScriptsRule,
  detectionEvasionRule,
];

export {
  credentialLeakRule,
  dangerousCommandsRule,
  dangerousScriptsRule,
  detectionEvasionRule,
  exfiltrationRule,
  hiddenUnicodeRule,
  promptInjectionRule,
};
