import type { Finding, Rule, Skill } from '../types.js';
import { matchPatterns, type PatternSpec } from './rule.js';

/**
 * Prompt-injection and instruction-override attempts inside skill content.
 * A skill is trusted context injected into the agent's session; these phrases
 * indicate it is trying to override the harness, hide behavior from the user,
 * or suppress safety checks.
 */
const SPECS: PatternSpec[] = [
  {
    pattern: /ignore\s+(all\s+|any\s+)?(previous|prior|earlier|above)\s+(instructions?|prompts?|rules?|context)/i,
    severity: 'critical',
    message: 'Instruction-override attempt ("ignore previous instructions")',
  },
  {
    pattern: /disregard\s+(your|the|all|any)\s+(system\s+prompt|instructions?|guidelines?|rules?|safety)/i,
    severity: 'critical',
    message: 'Instruction-override attempt ("disregard your system prompt/rules")',
  },
  {
    pattern: /(do\s+not|don'?t|never)\s+(tell|inform|notify|mention\s+(?:this\s+)?to|show|reveal\s+(?:this\s+)?to|alert|ask|warn)\s+(the\s+)?(user|human|operator)/i,
    severity: 'critical',
    message: 'Concealment instruction (hide actions or content from the user)',
  },
  {
    pattern: /without\s+(asking|telling|informing|notifying|confirming\s+with)\s+(the\s+)?(user|human)/i,
    severity: 'high',
    message: 'Instructs the agent to act without user confirmation',
  },
  {
    pattern: /(pretend|act\s+as\s+if|behave\s+as\s+though)\s+(you\s+(have\s+no|don'?t\s+have)|there\s+are\s+no)\s+(restrictions?|limitations?|guidelines?|rules?|safety)/i,
    severity: 'critical',
    message: 'Jailbreak-style role instruction (pretend restrictions do not exist)',
  },
  {
    pattern: /you\s+must\s+(always\s+)?(run|execute|call)\s+.{0,80}(before|first|immediately)/i,
    severity: 'medium',
    message: 'Unconditional execution demand — review what it forces the agent to run',
  },
  {
    pattern: /(this|the\s+following)\s+(instruction|step|section)s?\s+(take\s+precedence|overrides?|supersedes?)\s+.{0,40}(system|user|previous|all)/i,
    severity: 'high',
    message: 'Claims precedence over system or user instructions',
  },
  {
    pattern: /<\s*(system|assistant)\s*>|\[\s*system\s*\]|#{1,3}\s*system\s+prompt/i,
    severity: 'medium',
    message: 'Embedded fake system-role marker (possible conversation spoofing)',
  },
  {
    pattern: /(exfiltrate|leak|smuggle)\s+.{0,40}(data|secret|credential|token|key)/i,
    severity: 'critical',
    message: 'Explicit exfiltration language',
  },
];

export const promptInjectionRule: Rule = {
  id: 'prompt-injection',
  description: 'Detects instruction-override, concealment, and jailbreak phrasing in skill content',
  check(skill: Skill): Finding[] {
    const findings: Finding[] = [];
    for (const file of skill.files) {
      if (!file.path.endsWith('.md') && !file.path.endsWith('.txt')) continue;
      findings.push(...matchPatterns('prompt-injection', file, SPECS));
    }
    return findings;
  },
};
