# Support

## Where to get help

| Need | Go to |
|---|---|
| "How do I…" usage questions | [GitHub Discussions](https://github.com/wookat/skillgate/discussions) |
| Bug in SkillGate | [Bug report issue](https://github.com/wookat/skillgate/issues/new?template=bug_report.yml) |
| Feature request | [Feature request issue](https://github.com/wookat/skillgate/issues/new?template=feature_request.yml) |
| Report a malicious/vulnerable **MCP server** (advisory) | PR against [`advisories/`](advisories/) or an issue with public sources |
| Security vulnerability **in SkillGate itself** | [SECURITY.md](SECURITY.md) — never a public issue |
| Docs | https://skillgate.zalize.com |

## Before filing a bug

1. Update to the latest version.
2. Re-run with `--debug` and include the output (redact secrets — SkillGate tries
   not to print credentials, but double-check env values in configs).
3. Include: OS, Node version, the command you ran, the client config type
   (Claude Desktop / Claude Code / Cursor / VS Code / Codex / OpenCode), and
   `skillgate --version`.

## Response expectations

SkillGate is maintained on a best-effort basis. Issues are triaged weekly;
security reports are prioritized (see SECURITY.md for timelines). Being helpful
and providing a minimal reproduction dramatically speeds things up.
