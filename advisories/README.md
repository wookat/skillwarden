# SkillGate Advisory Database

A public, structured database of security advisories for Agent Skills (`SKILL.md`) —
malicious skills, prompt-injection payloads, hidden-Unicode smuggling, credential
theft, and supply-chain incidents across skill registries.

- Format: one JSON file per advisory, `SKA-YYYY-NNNN.json`, validated against
  [`schema/advisory.schema.json`](schema/advisory.schema.json) in CI.
- Categories mirror SkillGate's scan rule IDs so advisories can be cross-checked at
  scan time.
- Sister database: [AgentGate MCP advisories](https://github.com/wookat/agentgate/tree/main/advisories).

## Contributing an advisory

1. Copy an existing entry (or the schema) and fill in every required field. Every
   claim needs a public reference (report, registry takedown, source diff).
2. Only include incidents you can substantiate — this database is deliberately
   conservative; pattern write-ups without a concrete affected skill belong in docs,
   not here.
3. Open a PR. Schema validation runs automatically.

## Status

The database currently ships the schema and validation pipeline. Verified incident
entries are added as they are confirmed; see the
[Snyk skills-ecosystem threat report](https://github.com/snyk/agent-scan) for the
class of attacks being tracked.
