import type { Finding, Rule, Skill, SkillFile } from '../types.js';
import { lineOf } from './rule.js';

interface UnicodeClass {
  name: string;
  test: (cp: number) => boolean;
  /** Positions where the character is legitimate (e.g. a leading BOM). */
  skipAt?: (cp: number, charIndex: number) => boolean;
}

const CLASSES: UnicodeClass[] = [
  {
    name: 'zero-width character',
    test: (cp) => cp === 0x200b || cp === 0x200c || cp === 0x200d || cp === 0xfeff || cp === 0x2060,
    // A U+FEFF at offset 0 is a byte-order mark, not smuggled content.
    skipAt: (cp, i) => cp === 0xfeff && i === 0,
  },
  {
    name: 'bidirectional control character',
    test: (cp) => (cp >= 0x202a && cp <= 0x202e) || (cp >= 0x2066 && cp <= 0x2069) || cp === 0x061c,
  },
  {
    name: 'Unicode tag character (invisible instruction smuggling)',
    test: (cp) => cp >= 0xe0000 && cp <= 0xe007f,
  },
  {
    name: 'invisible formatting character',
    test: (cp) => cp === 0x00ad || cp === 0x034f || cp === 0x180e,
  },
  {
    name: 'private-use-area character',
    test: (cp) => (cp >= 0xe000 && cp <= 0xf8ff) || (cp >= 0xf0000 && cp <= 0xffffd) || (cp >= 0x100000 && cp <= 0x10fffd),
  },
];

const VARIATION_SELECTOR = 'variation-selector sequence (invisible data smuggling)';

function isVariationSelector(cp: number): boolean {
  // VS1..VS16 and the Variation Selectors Supplement (VS17..VS256).
  return (cp >= 0xfe00 && cp <= 0xfe0f) || (cp >= 0xe0100 && cp <= 0xe01ef);
}

/**
 * A single variation selector after a non-ASCII base character is ordinary text
 * (emoji presentation, e.g. `⚠️` = U+26A0 U+FE0F). Runs of two or more, or a
 * selector applied to an ASCII character, are the byte-smuggling pattern.
 */
function isBenignVariationSelector(text: string[], i: number): boolean {
  const prev = text[i - 1];
  const next = text[i + 1];
  if (next !== undefined && isVariationSelector(next.codePointAt(0)!)) return false;
  if (prev === undefined) return false;
  const prevCp = prev.codePointAt(0)!;
  if (isVariationSelector(prevCp)) return false;
  return prevCp > 0x7f;
}

function checkFile(file: SkillFile): Finding[] {
  const findings: Finding[] = [];
  const counts = new Map<string, { count: number; firstIndex: number }>();
  const chars = [...file.content];
  let index = 0;
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]!;
    const cp = ch.codePointAt(0)!;
    if (cp > 0x7f) {
      let name: string | undefined;
      if (isVariationSelector(cp)) {
        if (!isBenignVariationSelector(chars, i)) name = VARIATION_SELECTOR;
      } else {
        const cls = CLASSES.find((c) => c.test(cp));
        if (cls && !cls.skipAt?.(cp, i)) name = cls.name;
      }
      if (name) {
        const entry = counts.get(name);
        if (entry) entry.count++;
        else counts.set(name, { count: 1, firstIndex: index });
      }
    }
    index += ch.length;
  }
  for (const [name, { count, firstIndex }] of counts) {
    findings.push({
      ruleId: 'hidden-unicode',
      severity: name.startsWith('Unicode tag') || name === VARIATION_SELECTOR ? 'critical' : 'high',
      message: `${count} ${name}${count > 1 ? 's' : ''} found — invisible to human review`,
      file: file.path,
      line: lineOf(file.content, firstIndex),
    });
  }
  if (file.invalidUtf8) {
    findings.push({
      ruleId: 'hidden-unicode',
      severity: 'medium',
      message: 'File is not valid UTF-8 — reviewers and the agent may decode different text',
      file: file.path,
    });
  }
  return findings;
}

/**
 * Invisible / control Unicode that can smuggle instructions past human review
 * while remaining fully visible to the model. Tag characters (U+E0000..U+E007F)
 * and variation-selector runs are the canonical "invisible prompt injection" vectors.
 */
export const hiddenUnicodeRule: Rule = {
  id: 'hidden-unicode',
  description: 'Detects zero-width, bidi-control, tag, variation-selector, and other invisible Unicode characters',
  check(skill: Skill): Finding[] {
    return skill.files.flatMap(checkFile);
  },
};
