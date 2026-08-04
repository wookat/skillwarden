import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join, relative } from 'node:path';
import { parseFrontmatter } from './frontmatter.js';
import type { Skill, SkillFile } from './types.js';

/** Well-known skill directories, relative to a project root or the home directory. */
export const KNOWN_SKILL_DIRS = [
  '.claude/skills',
  '.agents/skills',
  '.agent/skills',
  '.codex/skills',
  '.gemini/skills',
  '.opencode/skills',
  '.cursor/skills',
  'skills',
] as const;

const TEXT_EXTENSIONS = new Set([
  '.md', '.txt', '.sh', '.bash', '.zsh', '.py', '.js', '.mjs', '.cjs', '.ts',
  '.mts', '.cts', '.json', '.yaml', '.yml', '.toml', '.xml', '.html', '.css',
  '.rb', '.pl', '.ps1', '.bat', '.cmd', '.env', '.cfg', '.ini', '.sql', '.csv',
]);

const MAX_FILE_BYTES = 1024 * 1024; // 1 MiB per file cap
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '__pycache__']);

function extensionOf(name: string): string {
  const idx = name.lastIndexOf('.');
  return idx === -1 ? '' : name.slice(idx).toLowerCase();
}

function isProbablyText(name: string, buf: Buffer): boolean {
  const ext = extensionOf(name);
  if (TEXT_EXTENSIONS.has(ext)) return true;
  if (ext !== '') return false;
  // Extension-less file: treat as text when there are no NUL bytes in the head.
  return !buf.subarray(0, 8192).includes(0);
}

function collectFiles(dir: string, root: string, out: SkillFile[]): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) collectFiles(full, root, out);
      continue;
    }
    if (!entry.isFile()) continue;
    const size = statSync(full).size;
    if (size > MAX_FILE_BYTES) continue;
    const buf = readFileSync(full);
    if (!isProbablyText(entry.name, buf)) continue;
    out.push({
      path: relative(root, full).split('\\').join('/'),
      content: buf.toString('utf8'),
      size,
    });
  }
}

/** Load one skill from a directory containing SKILL.md (or from a SKILL.md path). */
export function loadSkill(path: string): Skill {
  const stat = statSync(path);
  const dir = stat.isDirectory() ? path : dirname(path);
  const skillMd = join(dir, 'SKILL.md');
  if (!existsSync(skillMd)) {
    throw new Error(`No SKILL.md found in ${dir}`);
  }
  const files: SkillFile[] = [];
  collectFiles(dir, dir, files);
  files.sort((a, b) => (a.path === 'SKILL.md' ? -1 : b.path === 'SKILL.md' ? 1 : (a.path < b.path ? -1 : a.path > b.path ? 1 : 0)));
  const main = files.find((f) => f.path === 'SKILL.md')!;
  const frontmatter = parseFrontmatter(main.content);
  return { name: frontmatter.name ?? basename(dir), dir, frontmatter, files };
}

function isSkillDir(path: string): boolean {
  return existsSync(join(path, 'SKILL.md'));
}

/**
 * Resolve a user-supplied path into skills:
 * - a SKILL.md file or a directory containing one → that single skill
 * - a directory of skill directories (e.g. .claude/skills) → each child skill
 */
export function loadSkillsFromPath(path: string): Skill[] {
  const stat = statSync(path);
  if (stat.isFile()) return [loadSkill(path)];
  if (isSkillDir(path)) return [loadSkill(path)];
  const skills: Skill[] = [];
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    if (entry.isDirectory() && !SKIP_DIRS.has(entry.name) && isSkillDir(join(path, entry.name))) {
      skills.push(loadSkill(join(path, entry.name)));
    }
  }
  return skills;
}

export interface DiscoverOptions {
  /** Also look in well-known directories under the home directory. */
  machine?: boolean;
}

/** Discover skills in well-known directories under `root` (and optionally `~`). */
export function discoverSkills(root: string, options: DiscoverOptions = {}): Skill[] {
  const roots = [root];
  if (options.machine) roots.push(homedir());
  const seen = new Set<string>();
  const skills: Skill[] = [];
  for (const r of roots) {
    for (const rel of KNOWN_SKILL_DIRS) {
      const dir = join(r, rel);
      if (!existsSync(dir)) continue;
      for (const skill of loadSkillsFromPath(dir)) {
        if (seen.has(skill.dir)) continue;
        seen.add(skill.dir);
        skills.push(skill);
      }
    }
  }
  return skills;
}
