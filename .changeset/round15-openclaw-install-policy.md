---
'skillwarden': minor
---

New `skillwarden openclaw-install-policy` command: run SkillWarden as
OpenClaw's `security.installPolicy.exec` command (protocol v1). Reads the
staged-install request from stdin, scans the staged skill with the full rule
engine, and answers `allow`/`warn`/`block` on stdout — install-time gating
before a skill ever reaches the agent. Fail-closed: invalid requests,
unreadable staged paths, and paths without a `SKILL.md` are blocked;
`--block-on` (default `high`) and `--warn-on` (default `medium`) tune the
thresholds; `.skillwardenignore` applies.
