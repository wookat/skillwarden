export type Severity = 'low' | 'medium' | 'high' | 'critical';

export const SEVERITY_ORDER: Record<Severity, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

export interface Finding {
  ruleId: string;
  severity: Severity;
  message: string;
  /** Path of the offending file, relative to the skill directory. */
  file: string;
  /** 1-based line number, when the finding maps to a specific line. */
  line?: number;
  /** Short excerpt of the offending content (sanitized, no secrets). */
  snippet?: string;
}

export interface SkillFile {
  /** Path relative to the skill directory, POSIX separators. */
  path: string;
  /**
   * Text content available to the rules. Empty for binary files and truncated
   * to the scan cap for oversized files — `sha256` always covers the full bytes.
   */
  content: string;
  size: number;
  /** SHA-256 (hex) of the file's raw bytes. */
  sha256: string;
  /** File is not decodable text; `content` is empty. */
  binary?: boolean;
  /** File exceeds the scan cap; `content` holds only the leading bytes. */
  truncated?: boolean;
  /** File is nominally text but contains bytes that are not valid UTF-8. */
  invalidUtf8?: boolean;
  /** File is a symlink; target is resolved relative to the skill directory. */
  symlink?: boolean;
  /** Symlink target resolves outside the skill directory. */
  escapesSkillDir?: boolean;
  /** Resolved symlink target, when the link escapes the skill directory. */
  linkTarget?: string;
}

export interface SkillFrontmatter {
  name?: string;
  description?: string;
  [key: string]: string | undefined;
}

export interface Skill {
  /** Name from frontmatter, falling back to the directory name. */
  name: string;
  /** Absolute path to the skill directory. */
  dir: string;
  frontmatter: SkillFrontmatter;
  /** All text files in the skill directory (SKILL.md first). */
  files: SkillFile[];
}

export interface SkillScanResult {
  skill: Skill;
  findings: Finding[];
}

export interface Rule {
  id: string;
  description: string;
  check(skill: Skill): Finding[];
}
