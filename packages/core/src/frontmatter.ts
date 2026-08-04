import type { SkillFrontmatter } from './types.js';

/**
 * Minimal YAML frontmatter parser for SKILL.md files.
 * Supports the flat `key: value` subset used by the Agent Skills spec
 * (name, description, license, allowed-tools, metadata as raw strings),
 * including folded/literal block scalars (`>-`, `|`) and quoted values.
 * Not a general YAML parser by design — no external dependency.
 */

/** Strip a UTF-8 BOM, which otherwise hides the opening `---` fence. */
function stripBom(content: string): string {
  return content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
}

export function parseFrontmatter(content: string): SkillFrontmatter {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/.exec(stripBom(content));
  if (!match || match[1] === undefined) return {};
  const body = match[1];
  const result: SkillFrontmatter = {};
  const lines = body.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!kv) {
      i++;
      continue;
    }
    const key = kv[1]!;
    let value = (kv[2] ?? '').trim();
    if (value === '>-' || value === '>' || value === '|' || value === '|-') {
      const block: string[] = [];
      i++;
      while (i < lines.length && (/^\s+\S/.test(lines[i]!) || lines[i]!.trim() === '')) {
        block.push(lines[i]!.trim());
        i++;
      }
      value = block.join(value.startsWith('|') ? '\n' : ' ').trim();
    } else {
      if (
        (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
        (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
      ) {
        value = value.slice(1, -1);
      }
      i++;
    }
    result[key] = value;
  }
  return result;
}

/** Strip the frontmatter block, returning only the markdown body. */
export function stripFrontmatter(content: string): string {
  return stripBom(content).replace(/^---\r?\n[\s\S]*?\r?\n---(\r?\n|$)/, '');
}
