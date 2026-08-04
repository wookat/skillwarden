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
  /** UTF-8 content. Binary files are not loaded as SkillFile. */
  content: string;
  size: number;
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
