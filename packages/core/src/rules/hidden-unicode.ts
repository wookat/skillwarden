import type { Finding, Rule, Skill } from '../types.js';
import { lineOf } from './rule.js';

interface UnicodeClass {
  name: string;
  test: (cp: number) => boolean;
}

const CLASSES: UnicodeClass[] = [
  {
    name: 'zero-width character',
    test: (cp) => cp === 0x200b || cp === 0x200c || cp === 0x200d || cp === 0xfeff || cp === 0x2060,
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
    test: (cp) => cp === 0x00ad || cp === 0x034f || (cp >= 0xfe00 && cp <= 0xfe0f) || cp === 0x180e,
  },
  {
    name: 'private-use-area character',
    test: (cp) => (cp >= 0xe000 && cp <= 0xf8ff) || (cp >= 0xf0000 && cp <= 0xffffd) || (cp >= 0x100000 && cp <= 0x10fffd),
  },
];

/**
 * Invisible / control Unicode that can smuggle instructions past human review
 * while remaining fully visible to the model. Tag characters (U+E0000..U+E007F)
 * are the canonical "invisible prompt injection" vector.
 */
export const hiddenUnicodeRule: Rule = {
  id: 'hidden-unicode',
  description: 'Detects zero-width, bidi-control, tag, and other invisible Unicode characters',
  check(skill: Skill): Finding[] {
    const findings: Finding[] = [];
    for (const file of skill.files) {
      const counts = new Map<string, { count: number; firstIndex: number }>();
      let index = 0;
      for (const ch of file.content) {
        const cp = ch.codePointAt(0)!;
        if (cp > 0x7f) {
          for (const cls of CLASSES) {
            if (cls.test(cp)) {
              const entry = counts.get(cls.name);
              if (entry) entry.count++;
              else counts.set(cls.name, { count: 1, firstIndex: index });
              break;
            }
          }
        }
        index += ch.length;
      }
      for (const [name, { count, firstIndex }] of counts) {
        findings.push({
          ruleId: 'hidden-unicode',
          severity: name.startsWith('Unicode tag') ? 'critical' : 'high',
          message: `${count} ${name}${count > 1 ? 's' : ''} found — invisible to human review`,
          file: file.path,
          line: lineOf(file.content, firstIndex),
        });
      }
    }
    return findings;
  },
};
