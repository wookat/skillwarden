import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, existsSync, realpathSync, openSync, readSync, closeSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
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
  '.md', '.mdx', '.markdown', '.mdc', '.txt', '.text', '.rst', '.adoc',
  '.sh', '.bash', '.zsh', '.ksh', '.csh', '.fish', '.py', '.pyw', '.js', '.mjs',
  '.cjs', '.jsx', '.ts', '.mts', '.cts', '.tsx', '.json', '.jsonc', '.yaml',
  '.yml', '.toml', '.xml', '.html', '.htm', '.css', '.scss', '.rb', '.pl', '.pm',
  '.php', '.lua', '.awk', '.sed', '.tcl', '.r', '.jl', '.go', '.rs', '.java',
  '.kt', '.swift', '.c', '.h', '.cc', '.cpp', '.cs', '.ps1', '.psm1', '.psd1',
  '.bat', '.cmd', '.vbs', '.applescript', '.scpt', '.nu', '.env', '.cfg', '.ini',
  '.conf', '.properties', '.sql', '.csv', '.tsv', '.ipynb', '.patch', '.diff',
  '.gradle', '.tf', '.dockerfile', '.mk', '.gitignore', '.gitattributes',
]);

/** Content beyond this size is not decoded for rules, but is still hashed. */
const MAX_FILE_BYTES = 1024 * 1024; // 1 MiB
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '__pycache__']);

function extensionOf(name: string): string {
  const idx = name.lastIndexOf('.');
  return idx === -1 ? '' : name.slice(idx).toLowerCase();
}

/** Extensions that are always binary, even when the head happens to be NUL-free. */
const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.ico', '.tiff', '.avif',
  '.pdf', '.zip', '.gz', '.tgz', '.bz2', '.xz', '.7z', '.rar', '.jar', '.war',
  '.ttf', '.otf', '.woff', '.woff2', '.eot', '.mp3', '.mp4', '.mov', '.wav',
  '.webm', '.avi', '.so', '.dylib', '.dll', '.exe', '.bin', '.o', '.a', '.class',
  '.pyc', '.wasm', '.db', '.sqlite', '.parquet', '.xlsx', '.docx', '.pptx',
]);

function isProbablyText(name: string, head: Buffer): boolean {
  // NUL bytes mean the content is not scannable text, whatever the name says —
  // a UTF-16 or NUL-padded `SKILL.md` must not be treated as reviewed text.
  if (head.includes(0)) return false;
  const ext = extensionOf(name);
  if (TEXT_EXTENSIONS.has(ext)) return true;
  if (BINARY_EXTENSIONS.has(ext)) return false;
  // Unknown or missing extension: sniff, so an attacker cannot hide a payload
  // behind an unusual extension (.lua, .awk, .fish, ...).
  let control = 0;
  for (const byte of head) {
    if (byte < 0x09 || (byte > 0x0d && byte < 0x20)) control++;
  }
  return head.length === 0 || control / head.length < 0.1;
}

function hashFile(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function readHead(path: string, bytes: number): Buffer {
  const fd = openSync(path, 'r');
  try {
    const buf = Buffer.alloc(bytes);
    const read = readSync(fd, buf, 0, bytes, 0);
    return buf.subarray(0, read);
  } finally {
    closeSync(fd);
  }
}

/** True when the utf8 decoding of `buf` round-trips, i.e. the bytes are valid UTF-8. */
function isValidUtf8(buf: Buffer): boolean {
  return Buffer.compare(Buffer.from(buf.toString('utf8'), 'utf8'), buf) === 0;
}

function loadFile(full: string, root: string, name: string, isLink: boolean): SkillFile | undefined {
  let stat;
  try {
    stat = statSync(full); // follows symlinks
  } catch {
    return undefined; // broken symlink or unreadable entry
  }
  if (!stat.isFile()) return undefined;
  const size = stat.size;
  const head = readHead(full, Math.min(size, 8192));
  const text = isProbablyText(name, head);
  const file: SkillFile = {
    path: relative(root, full).split(sep).join('/'),
    content: '',
    size,
    sha256: hashFile(full),
  };
  if (!text) {
    file.binary = true;
  } else if (size > MAX_FILE_BYTES) {
    file.content = readHead(full, MAX_FILE_BYTES).toString('utf8');
    file.truncated = true;
  } else {
    const buf = readFileSync(full);
    file.content = buf.toString('utf8');
    // Undecodable bytes in a "text" file: keep the lossy content for the rules
    // but mark it — a reviewer's editor and the agent may see different text.
    if (!isValidUtf8(buf)) file.invalidUtf8 = true;
  }
  if (isLink) {
    file.symlink = true;
    try {
      const target = realpathSync(full);
      const rootReal = realpathSync(root);
      if (target !== rootReal && !target.startsWith(rootReal + sep)) {
        file.escapesSkillDir = true;
        file.linkTarget = target;
      }
    } catch {
      /* unresolvable target: still reported as a symlink */
    }
  }
  return file;
}

function collectFiles(dir: string, root: string, out: SkillFile[]): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) collectFiles(full, root, out);
      continue;
    }
    // Symlinked directories are not traversed (loop safety); symlinked files are
    // read, because the agent reads through them just the same.
    if (entry.isSymbolicLink()) {
      let target;
      try {
        target = statSync(full);
      } catch {
        continue;
      }
      if (target.isDirectory()) continue;
    } else if (!entry.isFile()) {
      continue;
    }
    const file = loadFile(full, root, entry.name, entry.isSymbolicLink());
    if (file) out.push(file);
  }
}

/** Name of the SKILL.md entrypoint in `dir`, matched case-insensitively. */
function findSkillManifest(dir: string): string | undefined {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return undefined;
  }
  const match = entries.find(
    (e) => e.name.toLowerCase() === 'skill.md' && (e.isFile() || e.isSymbolicLink()),
  );
  return match?.name;
}

/** Load one skill from a directory containing SKILL.md (or from a SKILL.md path). */
export function loadSkill(path: string): Skill {
  const stat = statSync(path);
  const dir = stat.isDirectory() ? path : dirname(path);
  const manifest = findSkillManifest(dir);
  if (!manifest) {
    throw new Error(`No SKILL.md found in ${dir}`);
  }
  const files: SkillFile[] = [];
  collectFiles(dir, dir, files);
  const main = files.find((f) => f.path === manifest);
  if (!main) {
    throw new Error(`SKILL.md in ${dir} could not be read`);
  }
  files.sort((a, b) => (a === main ? -1 : b === main ? 1 : a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  const frontmatter = parseFrontmatter(main.content);
  return { name: frontmatter.name ?? basename(dir), dir, frontmatter, files };
}

function isSkillDir(path: string): boolean {
  return findSkillManifest(path) !== undefined;
}

const MAX_DISCOVERY_DEPTH = 10;

/** All directories under `dir` (inclusive) that contain a SKILL.md, without descending into found skills. */
function findSkillDirs(dir: string, depth: number, out: string[]): void {
  if (isSkillDir(dir)) {
    out.push(dir);
    return;
  }
  if (depth >= MAX_DISCOVERY_DEPTH) return;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.isDirectory() && !SKIP_DIRS.has(entry.name)) {
      findSkillDirs(join(dir, entry.name), depth + 1, out);
    }
  }
}

/**
 * Resolve a user-supplied path into skills:
 * - a SKILL.md file or a directory containing one → that single skill
 * - any other directory → every skill found recursively beneath it
 *   (e.g. `.claude/skills`, or a plugin marketplace with `plugins/<name>/skills`)
 */
export function loadSkillsFromPath(path: string): Skill[] {
  if (!existsSync(path)) {
    throw new Error(`Path does not exist: ${path}`);
  }
  const stat = statSync(path);
  if (stat.isFile()) return [loadSkill(path)];
  const dirs: string[] = [];
  findSkillDirs(path, 0, dirs);
  return dirs.map((d) => loadSkill(d));
}

export interface DiscoverOptions {
  /** Also look in well-known directories under the home directory. */
  machine?: boolean;
}

/**
 * Discover skills under `root` (and optionally `~`): well-known directories
 * first, then a recursive search of the whole tree so nested layouts
 * (`plugins/<name>/skills`, monorepo packages) are found too.
 */
export function discoverSkills(root: string, options: DiscoverOptions = {}): Skill[] {
  const seen = new Set<string>();
  const skills: Skill[] = [];
  const add = (found: Skill[]) => {
    for (const skill of found) {
      if (seen.has(skill.dir)) continue;
      seen.add(skill.dir);
      skills.push(skill);
    }
  };
  for (const rel of KNOWN_SKILL_DIRS) {
    const dir = resolve(root, rel);
    if (existsSync(dir)) add(loadSkillsFromPath(dir));
  }
  add(loadSkillsFromPath(root));
  if (options.machine) {
    for (const rel of KNOWN_SKILL_DIRS) {
      const dir = resolve(homedir(), rel);
      if (existsSync(dir)) add(loadSkillsFromPath(dir));
    }
  }
  return skills;
}

export { MAX_FILE_BYTES };
