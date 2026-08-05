import type { Finding, Rule, Skill } from '../types.js';
import { isDocFile, isNegated, isScriptFile, matchPatterns, type PatternSpec } from './rule.js';

/**
 * Prompt-injection and instruction-override attempts inside skill content.
 * A skill is trusted context injected into the agent's session; these phrases
 * indicate it is trying to override the harness, hide behavior from the user,
 * or suppress safety checks.
 */

/** Documentation about injections ("never ignore previous instructions") is not one. */
const notNegated: NonNullable<PatternSpec['guard']> = (_m, content, index) => !isNegated(content, index);

const SPECS: PatternSpec[] = [
  {
    pattern: /ignore\s+(all\s+|any\s+)?(previous|prior|earlier|above)\s+(instructions?|prompts?|rules?|context)/i,
    severity: 'critical',
    message: 'Instruction-override attempt ("ignore previous instructions")',
    guard: notNegated,
  },
  {
    pattern: /disregard\s+(your|the|all|any)\s+(system\s+prompt|instructions?|guidelines?|rules?|safety)/i,
    severity: 'critical',
    message: 'Instruction-override attempt ("disregard your system prompt/rules")',
    guard: notNegated,
  },
  {
    pattern: /(forget|disregard|discard)\s+(everything|all|any(thing)?)\s+(you\s+(were\s+)?(told|learned|know)|(that\s+)?(came\s+)?(before|above|earlier)|previous|prior)/i,
    severity: 'critical',
    message: 'Instruction-override attempt ("forget everything before")',
    guard: notNegated,
  },
  {
    pattern: /(override|overrule|replace|reset)\s+(your|the|any|all)\s+(system\s+prompt|instructions?|guidelines?|rules?|safety|guardrails?|policies|policy)/i,
    severity: 'critical',
    message: 'Instruction-override attempt ("override your system prompt/rules")',
    guard: notNegated,
  },
  {
    pattern: /(bypass|circumvent|turn\s+off|disable)\s+(all\s+|any\s+|the\s+|your\s+)?(safety|security|guardrails?|sandbox|restrictions?|protections?)/i,
    severity: 'critical',
    message: 'Instructs the agent to bypass safety or sandbox restrictions',
    guard: notNegated,
  },
  {
    pattern: /(bypass|circumvent|skip|suppress)\s+(all\s+|any\s+|the\s+|your\s+)?(permission|approval|confirmation|consent)\s*(checks?|prompts?|steps?|dialogs?)?/i,
    severity: 'high',
    message: 'Instructs the agent to skip permission or approval checks',
    guard: notNegated,
  },
  {
    pattern: /\b(DAN|jailbreak|unrestricted|god)\s+mode\b|\b(enter|activate|enabled?|you\s+are\s+(now\s+)?in)\s+developer\s+mode\b/i,
    severity: 'high',
    message: 'Jailbreak persona activation ("DAN / developer mode")',
    guard: notNegated,
  },
  {
    pattern: /\b(system|assistant|developer)\s*(prompt)?\s*:\s*(new|updated|revised|additional|override|overriding)\s+(instructions?|rules?|directives?|prompt)/i,
    severity: 'high',
    message: 'Fake system-message boundary announcing new instructions',
  },
  {
    pattern: /\b(new|updated|revised|additional|real)\s+(system\s+)?instructions?\s*(follow|below|start|begin|:)/i,
    severity: 'high',
    message: 'Injected instruction boundary ("new instructions follow")',
    guard: notNegated,
  },
  {
    pattern: /(do\s+not|don'?t|never)\s+(tell|inform|notify|mention\s+(?:this\s+)?to|show|reveal\s+(?:this\s+)?to|alert|warn)\s+(the\s+)?(user|human|operator)/i,
    severity: 'critical',
    message: 'Concealment instruction (hide actions or content from the user)',
  },
  {
    pattern: /(do\s+not|don'?t|never)\s+(mention|report|log|include|list|describe|summari[sz]e)\s+(this|these|that|it|them|the\s+\w+)\s+(step|action|command|file|change|edit)?s?\s*(in|to)\s+(your|the)\s+(summary|report|output|response|reply|answer|log)/i,
    severity: 'critical',
    message: 'Concealment instruction (omit actions from the report to the user)',
  },
  {
    // "suppress output" is also ordinary CLI phrasing, hence medium.
    pattern: /\b(suppress|omit|withhold|hide|strip)\s+(any|all|every|the)?\s*(output|logs?|log\s+lines?|mentions?|references?|traces?|evidence)\b/i,
    severity: 'medium',
    message: 'Instructs the agent to suppress output or traces of its actions',
    guard: notNegated,
  },
  {
    pattern: /\b(silently|quietly|covertly|stealthily|secretly)\s+(run|execute|call|send|copy|upload|post|delete|modify|install|write|read)/i,
    severity: 'high',
    message: 'Instructs the agent to act silently (no user-visible trace)',
  },
  {
    pattern: /\b(keep|hide|conceal)\s+(this|it|these|that|the\s+\w+)\s+(hidden|secret|invisible|out\s+of\s+(?:the\s+)?(?:sight|view))?\s*(from|to)\s+(the\s+)?(user|human|operator)/i,
    severity: 'critical',
    message: 'Concealment instruction (hide actions or content from the user)',
  },
  {
    pattern: /(do\s+not|don'?t|never)\s+ask\s+(the\s+)?(user|human|operator)\s+(for\s+)?(permission|confirmation|approval|consent|before)/i,
    severity: 'high',
    message: 'Instructs the agent to skip asking the user for permission',
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
    pattern: /you\s+must\s+(always\s+)?(run|execute)\s+.{0,80}(before|first|immediately)/i,
    severity: 'medium',
    message: 'Unconditional execution demand — review what it forces the agent to run',
  },
  {
    pattern: /(this|the\s+following)\s+(instruction|step|section)s?\s+(take\s+precedence|overrides?|supersedes?)\s+.{0,40}(system|user|previous|all)/i,
    severity: 'high',
    message: 'Claims precedence over system or user instructions',
    guard: notNegated,
  },
  {
    // Markdown headings such as "## System prompts" are ordinary documentation and
    // are deliberately not matched here — only inline role markers are.
    pattern: /<\s*(system|assistant)\s*>|\[\s*(system|\/?INST)\s*\]|<\|\s*(system|im_start)\s*\|>/i,
    severity: 'medium',
    message: 'Embedded fake system-role marker (possible conversation spoofing)',
  },
  {
    pattern: /(exfiltrate|smuggle)\s+.{0,40}(data|secret|credential|token|key)|\bleak\s+.{0,30}(data|secret|credential|token|key)/i,
    severity: 'critical',
    message: 'Explicit exfiltration language',
    guard: notNegated,
  },
  // Non-English equivalents of the highest-signal patterns above. Coverage is
  // deliberately narrow per language (see docs/reviews/M1-rule-engine-review.md).
  {
    pattern: /(忽略|无视|忘掉|忘记|抛弃)(上面|上述|以上|之前|先前|所有|全部|前面)*(的)?(所有|全部)?(指令|指示|提示|规则|要求|命令|系统提示)/,
    severity: 'critical',
    message: 'Instruction-override attempt (Chinese: "忽略以上指令")',
  },
  {
    pattern: /(不要|不得|禁止|无需|别)(告知|告诉|通知|提醒|询问|报告|提及|显示)(给)?(用户|使用者|人类|操作者|主人)/,
    severity: 'critical',
    message: 'Concealment instruction (Chinese: "不要告诉用户")',
  },
  {
    pattern: /(绕过|跳过|关闭|禁用|规避)(所有|全部|任何)?(安全|权限|确认|审核|检查|限制|沙箱)/,
    severity: 'critical',
    message: 'Instructs the agent to bypass safety checks (Chinese)',
  },
  // Other languages: the same instruction-override phrasing. Kept to the highest
  // signal wording per language to avoid false positives on ordinary prose.
  {
    pattern: /(以前|これまで|それまで|上記|先|前)[^。\n]{0,12}(指示|命令|ルール|プロンプト)[^。\n]{0,12}(無視|忘れ|破棄|上書き)/,
    severity: 'critical',
    message: 'Instruction-override attempt (Japanese: "これまでの指示を無視")',
  },
  {
    pattern: /(ユーザー|利用者|人間|操作者)(に|には)[^。\n]{0,12}(知らせ|教え|報告|通知|表示|言わ)[^。\n]{0,8}(ない|ないで|るな|禁止)/,
    severity: 'critical',
    message: 'Concealment instruction (Japanese: "ユーザーに知らせないで")',
  },
  {
    pattern: /(이전|위의|앞의|모든)\s*(지시|명령|규칙|프롬프트)[^\n]{0,8}(무시|잊)/,
    severity: 'critical',
    message: 'Instruction-override attempt (Korean)',
  },
  {
    pattern: /\b(ignor[ae]|olvida|descarta|desconsidere?)\s+(todas?\s+)?(l[ao]s\s+|as\s+)?(instruc\w+|reglas|regras|órdenes)\s+(anterior\w*|previ\w+|pr[eé]vias?|acima)/i,
    severity: 'critical',
    message: 'Instruction-override attempt (Spanish/Portuguese)',
  },
  {
    // Cyrillic ranges spelled out: JavaScript's \w is ASCII-only.
    pattern: /(игнорируй[а-яё]*|забудь[а-яё]*|не\s+учитывай)[^\n]{0,30}(инструкци[а-яё]*|указани[а-яё]*|правил[а-яё]*|промпт[а-яё]*)/i,
    severity: 'critical',
    message: 'Instruction-override attempt (Russian)',
  },
  {
    pattern: /\b(ignore[zr]?|oubli(?:e|ez))\s+(toutes?\s+)?(les\s+)?(instructions?|r[eè]gles?|consignes?)\s+(pr[eé]c[eé]dentes?|ant[eé]rieures?|ci-dessus)/i,
    severity: 'critical',
    message: 'Instruction-override attempt (French)',
  },
  {
    pattern: /\b(ignoriere|vergiss|missachte)\s+(alle\s+)?(vorherigen?|obigen?|bisherigen?)\s+(anweisungen|regeln|instruktionen)/i,
    severity: 'critical',
    message: 'Instruction-override attempt (German)',
  },
];

export const promptInjectionRule: Rule = {
  id: 'prompt-injection',
  description: 'Detects instruction-override, concealment, and jailbreak phrasing in skill content',
  check(skill: Skill): Finding[] {
    const findings: Finding[] = [];
    for (const file of skill.files) {
      // Agents read bundled scripts too — a docstring or comment is as much an
      // instruction channel as SKILL.md.
      if (!isDocFile(file.path) && !isScriptFile(file.path)) continue;
      findings.push(...matchPatterns('prompt-injection', file, SPECS));
    }
    return findings;
  },
};
