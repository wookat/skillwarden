import type { Finding, Rule, Skill } from '../types.js';
import { MAX_FILE_BYTES } from '../discovery.js';
import { isScriptFile, matchPatterns, type PatternSpec } from './rule.js';

/**
 * Suspicious constructs in bundled scripts (scripts/*.sh, *.py, *.js, ...):
 * dynamic code execution, obfuscated payloads, and eval-of-download chains.
 * These run with the user's full privileges when the agent executes them.
 */
const SPECS: PatternSpec[] = [
  {
    pattern: /\beval\s*\(\s*(atob|base64|Buffer\.from|codecs\.decode|bytes\.fromhex)/i,
    severity: 'critical',
    message: 'eval() of decoded payload — obfuscated code execution',
  },
  {
    pattern: /\beval\s+["']?\$\(([^)]*\b(base64|xxd|openssl\s+enc|curl|wget)\b[^)]*)\)/i,
    severity: 'critical',
    message: 'Shell eval of a decoded or downloaded payload',
  },
  {
    pattern: /\bexec\s*\(\s*(compile|base64|codecs\.decode|marshal\.loads|zlib\.decompress|__import__|bytes\.fromhex|gzip\.decompress)/i,
    severity: 'critical',
    message: 'Python exec() of dynamic payload',
  },
  {
    pattern: /\b(?:const|let|var)\s+(\w+)\s*=\s*(?:global(?:This)?\.)?eval\b|\[\s*["']eval["']\s*\]\s*\(|\bglobal(?:This)?\s*\[\s*["']eval["']\s*\]/,
    severity: 'high',
    message: 'Indirect eval reference — obfuscated dynamic execution',
  },
  {
    pattern: /\bnew\s+Function\s*\(\s*(atob|Buffer\.from|decodeURIComponent|\w+\s*\.\s*toString\s*\()/,
    severity: 'critical',
    message: 'Function constructor over a decoded payload — obfuscated code execution',
  },
  {
    pattern: /getattr\s*\(\s*__import__\s*\(|__import__\s*\(\s*["'](os|subprocess|socket|ctypes)["']\s*\)/,
    severity: 'high',
    message: 'Dynamic module/attribute lookup used to hide a dangerous call',
  },
  {
    pattern: /(new\s+Function|child_process|execSync|spawnSync?)\s*\([^\n)]*\+/,
    severity: 'high',
    message: 'Dynamic command construction passed to an executor',
  },
  {
    pattern: /\b(os\.system|subprocess\.(run|call|Popen))\s*\(\s*f?["'][^"'\n]*\{/,
    severity: 'high',
    message: 'Shell command built by string interpolation (injection risk)',
  },
  {
    pattern: /["'][A-Za-z0-9+/]{200,}={0,2}["']/,
    severity: 'high',
    message: 'Large base64 blob in a script — possible embedded payload',
  },
  {
    pattern: /(\\x[0-9a-f]{2}){20,}/i,
    severity: 'high',
    message: 'Long hex-escape sequence — obfuscated payload',
  },
  {
    pattern: /String\.fromCharCode\s*\((\s*\d+\s*,){10,}/,
    severity: 'high',
    message: 'Char-code obfuscated string construction',
  },
  {
    pattern: /(urllib\.request\.urlopen|requests\.get|fetch|https?\.get)\s*\([^\n)]*\)[^\n]{0,40}(exec|eval|\.run|subprocess|Function)/i,
    severity: 'critical',
    message: 'Download-then-execute chain',
  },
  {
    // exec/eval over a string rebuilt by reversing, joining or slicing:
    // obfuscation that carries no base64 or hex signature.
    pattern:
      /\b(?:exec|eval)\s*\(\s*(?:["'][^"'\n]*["']\s*\.\s*join\s*\(\s*(?:reversed|list)|\w+\s*\[\s*::\s*-1\s*\]|\[\s*\.\.\.[^\n\]]*\]\s*\.\s*reverse|\w+\s*\.\s*split\s*\([^\n)]*\)\s*\.\s*reverse)/,
    severity: 'critical',
    message: 'exec/eval of a string rebuilt at runtime (reversed or re-joined) — obfuscated code execution',
  },
  {
    // exec/eval driven from a comprehension or map over a list of code strings:
    // hides the payload from single-statement patterns.
    pattern: /\[\s*(?:exec|eval)\s*\(\s*\w+\s*\)\s*for\s+\w+\s+in\b|\bmap\s*\(\s*(?:exec|eval)\s*,/,
    severity: 'critical',
    message: 'exec/eval applied over a list of code strings — obfuscated multi-step execution',
  },
];

/**
 * Agent configuration files that execute on their own schedule (hooks, session
 * events, MCP servers). A skill has no reason to ship them: whatever they run
 * happens outside the skill's own invocation and outside its reviewed scope.
 */
const AGENT_CONFIG_PATH =
  /(?:^|\/)\.(?:claude|codex|gemini|cursor|openclaw|continue|windsurf)\/(?:hooks?\/|settings(?:\.local)?\.json|config\.(?:json|toml|ya?ml)|mcp(?:_servers)?\.json)/i;

export const dangerousScriptsRule: Rule = {
  id: 'dangerous-scripts',
  description: 'Detects dynamic execution, obfuscation, download-execute chains, and unreviewable payloads in bundled files',
  check(skill: Skill): Finding[] {
    const findings: Finding[] = [];
    const binaries: string[] = [];
    for (const file of skill.files) {
      // Content that no rule can read is worth surfacing: it ships with the skill
      // and is pinned by the lockfile, but its behaviour cannot be reviewed.
      if (file.binary) {
        // The manifest is the part the agent always reads; if the scanner cannot
        // decode it (UTF-16, embedded NULs), nothing in it has been reviewed.
        if (file.path.toLowerCase() === 'skill.md') {
          findings.push({
            ruleId: 'dangerous-scripts',
            severity: 'high',
            message: 'SKILL.md is not decodable UTF-8 text — its instructions were not reviewed by any rule',
            file: file.path,
          });
        } else {
          binaries.push(file.path);
        }
      } else if (file.truncated) {
        findings.push({
          ruleId: 'dangerous-scripts',
          severity: 'medium',
          message: `File exceeds the ${MAX_FILE_BYTES} byte scan cap (${file.size} bytes) — only its head was analysed`,
          file: file.path,
        });
      }
      if (AGENT_CONFIG_PATH.test(file.path)) {
        findings.push({
          ruleId: 'dangerous-scripts',
          severity: 'high',
          message:
            'Skill ships an agent configuration/hook file — it runs on the agent\'s own events, outside this skill\'s invocation',
          file: file.path,
        });
      }
      if (!isScriptFile(file.path) || !file.content) continue;
      findings.push(...matchPatterns('dangerous-scripts', file, SPECS));
    }
    if (binaries.length > 0) {
      const shown = binaries.slice(0, 3).join(', ');
      findings.push({
        ruleId: 'dangerous-scripts',
        severity: 'low',
        message: `${binaries.length} non-text file${binaries.length === 1 ? '' : 's'} bundled in skill — pinned by the lockfile but not reviewable by scanning (${shown}${binaries.length > 3 ? ', …' : ''})`,
        file: binaries[0]!,
      });
    }
    return findings;
  },
};
