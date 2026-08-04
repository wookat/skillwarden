# 发布内容包草稿（内部草稿，未经总负责人指令不得对外发布）

## Show HN 草稿

**Title:** Show HN: SkillWarden – scan, lock, and CI-gate your agent skills (SKILL.md)

**Body:**

Agent skills (SKILL.md files for Claude Code, Codex, Gemini CLI, Cursor, and 30+
other tools) are executable context: they steer your agent and often ship scripts it
runs with your privileges. Installing one is `git clone` + copy — there's no audit,
no pinning, and no way to notice when an approved skill's upstream quietly changes.

SkillWarden is an offline, deterministic security gate for that supply chain:

- `skillwarden scan` — six rule families: prompt injection / instruction overrides,
  hidden Unicode (zero-width, bidi, tag characters), dangerous commands
  (curl|bash, reverse shells), credential leaks, exfiltration vectors, and
  obfuscated bundled scripts. Table, JSON, or SARIF output.
- `skillwarden lock` — pins every file of every approved skill (per-file SHA-256)
  into skillwarden.lock. Rug-pull defense.
- `skillwarden ci` — fails CI on any drift from the approved baseline or on
  findings at your severity threshold. There's a one-step GitHub Action.
- A public, structured advisory database of real malicious-skill incidents.

No account, no API key, no LLM, no network. `npm i -g skillwarden`.

Repo: https://github.com/wookat/skillwarden
Docs: https://skillwarden.zalize.com

Sister project of AgentGate (same loop for MCP servers). Feedback very welcome —
especially false positives/negatives; there's a detection-gap issue template.

## awesome-agent-skills 收录 PR 一句话

> [SkillWarden](https://github.com/wookat/skillwarden) — offline security scanner +
> lockfile drift gate + GitHub Action for skills: prompt injection, hidden Unicode,
> dangerous commands, credential leaks; public advisory DB.

## X/Twitter 线程草稿（3 条）

1. Every day thousands of agent skills get published. Installing one is git clone +
   copy. Nobody scans them. Nobody pins them. Your agent runs them with your
   privileges. We built SkillWarden to fix that. 🧵
2. skillwarden scan → 6 deterministic rule families (injection, hidden Unicode,
   curl|bash, credential leaks, exfil, obfuscated scripts). skillwarden lock → SHA-256
   pin every approved file. skillwarden ci → CI fails on drift or findings. Offline,
   no API key, reproducible.
3. Plus a public advisory DB of real malicious-skill incidents, SARIF for GitHub code
   scanning, and a one-step Action. npm i -g skillwarden · skillwarden.zalize.com

## 备注

- 发布时间与渠道由总负责人决定；本文件仅为草稿。
- 发布前核对：README demo 动画正常渲染、npm badge 显示 0.2.x、文档站 200。
