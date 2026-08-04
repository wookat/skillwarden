---
title: FAQ
description: Frequently asked questions about SkillWarden — coverage, false positives, offline guarantees, and how it compares to LLM-based audits.
---

## Does SkillWarden execute my skills?

No. Scanning is purely static: files are read, never executed, and no subcommand
makes network requests. Results are deterministic — the same input always produces
the same findings.

## Why deterministic rules instead of an LLM audit?

Both have value. An LLM audit can catch semantic attacks that patterns miss, but it
is non-deterministic (a gate that flakes is a gate that gets disabled), needs an API
key and network access, and its verdicts can't be reproduced or diffed. SkillWarden
is built to run in CI on every push, so it chooses reproducibility. See the
[comparison](/docs/comparison/) for how this stacks against LLM-based scanners.

## What does the lockfile protect me from?

Rug-pulls: an approved skill whose upstream content changes after you reviewed it.
`skillwarden lock` pins every file of every approved skill with SHA-256 (raw bytes),
and `skillwarden ci` fails on any drift — files added, removed, or modified —
before findings are even considered. See the [lockfile spec](/docs/lockfile/).

## I got a false positive. What do I do?

Open a [detection-gap issue](https://github.com/wookat/skillwarden/issues/new/choose)
with the snippet. Rules are tuned against a corpus of real public skills (negation
guards, emoji variation-selector handling, script-comment scoping), and false
positives are treated as bugs. In the meantime you can gate at a higher threshold
(`--fail-on critical`) — findings are still reported, they just don't fail the gate.

## Which ecosystems are discovered automatically?

`.claude/skills`, `.agents/skills`, `.agent/skills`, `.codex/skills`,
`.gemini/skills`, `.opencode/skills`, `.cursor/skills`, and `skills/`. You can also
pass explicit paths (a skill directory, a `SKILL.md`, or a parent directory).

## Can a skill hide content from the scanner?

The gaps we know about are documented honestly: the scanner reads every regular
file's raw bytes (binary and oversized files are hashed and flagged rather than
silently skipped), follows file symlinks (a symlink escaping the skill directory is
a finding), and scans whole files for hidden Unicode. Residual risks (e.g. semantic
attacks in plain prose) are listed in the
[threat model](https://github.com/wookat/skillwarden/blob/main/docs/THREAT-MODEL.md).

## Does it work offline / in air-gapped CI?

Yes. No account, no API key, no telemetry, no network. The advisory database ships
in the repository.

## Is this affiliated with skillgate.sh?

No. SkillWarden (formerly developed under the working name "SkillGate") is not
affiliated with skillgate.sh or the npm package `skillgate`, an unrelated cloud
LLM-audit tool by another author.
