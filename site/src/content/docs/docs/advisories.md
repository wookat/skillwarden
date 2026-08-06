---
title: Advisory database
description: A public, structured database of security advisories for Agent Skills — format, contribution rules, and status.
---

A public, structured database of security advisories for Agent Skills (`SKILL.md`) —
malicious skills, prompt-injection payloads, hidden-Unicode smuggling, credential
theft, and supply-chain incidents across skill registries. It lives in the
[`advisories/`](https://github.com/wookat/skillwarden/tree/main/advisories) directory of
the SkillWarden repository.

## Format

- One JSON file per advisory, named `SKA-YYYY-NNNN.json`, validated against
  [`schema/advisory.schema.json`](https://github.com/wookat/skillwarden/tree/main/advisories/schema)
  in CI.
- Categories mirror SkillWarden's [scan rule IDs](/docs/rules/) so advisories can be
  cross-checked at scan time.
- Sister database:
  [AgentGate MCP advisories](https://github.com/wookat/agentgate/tree/main/advisories).

## Contributing an advisory

1. Copy an existing entry (or the schema) and fill in every required field. Every
   claim needs a public reference (report, registry takedown, source diff).
2. Only include incidents you can substantiate — this database is deliberately
   conservative; pattern write-ups without a concrete affected skill belong in docs,
   not here.
3. Open a PR against
   [wookat/skillwarden](https://github.com/wookat/skillwarden). Schema validation runs
   automatically.

## Status

The database ships 21 verified advisories (SKA-2026-0001 … SKA-2026-0021) covering
the major publicly documented skills-ecosystem campaigns — ClawHavoc, the AMOS
dropper waves, typosquat clusters, SkillPay billing anti-patterns, DeepSeek-Claw,
and agentic threats such as runtime affiliate injection and front-running. Every
entry cites public analyses (Koi Security, Trend Micro, Unit 42, Zscaler, JFrog,
VirusTotal, and others) and separates verified fact from inference.

Advisory names and campaign infrastructure domains feed the offline
[`known-advisory`](/docs/rules/known-advisory/) scan rule, so referencing a known
malicious skill or its infrastructure is itself a finding.
