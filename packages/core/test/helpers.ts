import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { loadSkill } from '../src/discovery.js';
import type { Skill } from '../src/types.js';

/** Create a temp skill directory from a map of relative path → content. */
export function makeSkill(files: Record<string, string>): Skill {
  const dir = mkdtempSync(join(tmpdir(), 'skillgate-test-'));
  for (const [rel, content] of Object.entries(files)) {
    const full = join(dir, rel);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content, 'utf8');
  }
  return loadSkill(dir);
}

export const BENIGN_SKILL_MD = `---
name: format-code
description: Format the project code with prettier. Use when asked to clean up formatting.
---

# Format code

Run \`npx prettier --write .\` and report the changed files.
`;
