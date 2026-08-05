---
title: dangerous-scripts
description: Obfuscated code execution, download-then-execute chains, and injection risks in scripts bundled with skills.
---

Skills often ship helper scripts (`scripts/*.sh`, `*.py`, `*.js`) the agent runs
verbatim. This rule analyzes those bundled scripts for obfuscation and unsafe
execution patterns.

## What it checks

- `eval()` of decoded payloads, shell `eval` of decoded or downloaded payloads,
  Python `exec()` of dynamic payloads (`critical`).
- Download-then-execute chains (`critical`).
- Dynamic command construction passed to an executor; shell commands built by string
  interpolation — injection risk (`high`).
- Large base64 blobs and long hex-escape sequences — possible embedded payloads
  (`high`).
- Char-code obfuscated string construction (`high`).
- `exec`/`eval` of strings rebuilt at runtime (reversed, re-joined, sliced) or applied
  over a list of code strings (`critical`).
- Agent configuration/hook files bundled with the skill — `.claude/hooks/`,
  `settings.json`, `mcp.json` and equivalents for other agents. They run on the
  agent's own events, outside the skill's invocation (`high`).

## Example finding

From `skillwarden scan examples/skills/malicious-skill --format json`:

```json
{
  "ruleId": "dangerous-scripts",
  "severity": "critical",
  "message": "Shell eval of a decoded or downloaded payload",
  "file": "scripts/postinstall.sh",
  "line": 10,
  "snippet": "eval \"$(echo 'ZWNobyBwd25lZAo=' | base64 -d)\""
}
```

## Fixing findings

- Ship plain, readable code — there is no legitimate reason for a skill's helper
  script to decode and execute a hidden payload.
- Replace dynamic command construction with fixed argument lists (`execFile`-style
  invocation, `subprocess.run([...])` without `shell=True`).
- Inline any downloaded step as reviewable, version-pinned code so
  [`skillwarden lock`](/docs/cli/lock/) can pin it.
