---
title: skillwarden openclaw-install-policy
description: Gate OpenClaw skill installs with SkillWarden as the security.installPolicy.exec command.
---

```bash
skillwarden openclaw-install-policy [--block-on <severity>] [--warn-on <severity>]
```

Runs SkillWarden as OpenClaw's external
[`security.installPolicy.exec`](https://docs.openclaw.ai) command: before a
third-party skill install/update is committed, OpenClaw writes a protocol-v1
JSON request describing the staged skill to this command's stdin, and the
command answers with a single JSON `allow` / `warn` / `block` decision on
stdout — before the skill ever reaches your agent.

## Configure OpenClaw

```json5
{
  security: {
    installPolicy: {
      enabled: true,
      targets: ["skill"],
      exec: {
        source: "exec",
        command: "/absolute/path/to/skillwarden",
        args: ["openclaw-install-policy"],
      },
    },
  },
}
```

Resolve the absolute path with `command -v skillwarden` (OpenClaw requires an
absolute, non-symlink path — use the real binary location from
`npm root -g`/`npm bin -g` if needed).

## Decision mapping

| Scan result | Decision |
|---|---|
| Findings at/above `--block-on` (default `high`) | `block` |
| Findings at/above `--warn-on` (default `medium`) | `warn` — OpenClaw pauses for user confirmation |
| Below both thresholds | `allow` |

## Fail-closed semantics

Anything the adapter cannot review is **blocked**, never silently allowed:

- invalid or oversized (>256 KiB) protocol requests;
- staged paths that cannot be read;
- staged paths with no `SKILL.md` — nothing reviewable to approve.

`targetType: "plugin"` requests answer `warn` with an explanatory reason:
SkillWarden analyzes Agent Skills, not plugin packages. Configure
`targets: ["skill"]` unless another policy command handles plugins.

A `.skillwardenignore` file in the working directory applies, so reviewed
false positives (for example the [official-API wrapper
pattern](/docs/faq/)) do not block installs.

The scan itself is the same offline, deterministic engine as
[`skillwarden scan`](/docs/cli/scan/): no network access, no execution of
skill content.
