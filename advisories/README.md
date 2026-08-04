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

Pattern-level analysis that cannot be tied to a named skill lives in
[docs/THREAT-MODEL.md](../docs/THREAT-MODEL.md), which also documents what SkillGate's
rules do *not* catch.

## Index

| ID | Type | Severity | Affected skills (source) |
|---|---|---|---|
| [SKA-2026-0001](SKA-2026-0001.json) | malicious-skill | critical | ClawHavoc — 335 mass-published ClawHub skills (crypto, YouTube, CLI typosquats, auto-updaters) |
| [SKA-2026-0002](SKA-2026-0002.json) | malicious-skill | critical | `Aslaep123/base-agent`, `bybit-agent`, `polymarket-traiding-bot`, `reddit-trends`, `axiom-agent` (ClawHub) |
| [SKA-2026-0003](SKA-2026-0003.json) | supply-chain | critical | `zaycv/clawhub`, `clawhub1`, `clawhud` + 4 more (ClawHub) |
| [SKA-2026-0004](SKA-2026-0004.json) | dangerous-scripts | critical | `better-polymarket`, `polymarket-all-in-one` (ClawHub) |
| [SKA-2026-0005](SKA-2026-0005.json) | exfiltration | critical | `rankaj` (ClawHub) |
| [SKA-2026-0006](SKA-2026-0006.json) | prompt-injection | critical | `google-qx4`, `whatsapp-mgv`, `coding-agent-1gx`, `clawhub` (GitHub `aztr0nutzs/NET_NiNjA.v1.2`) |
| [SKA-2026-0007](SKA-2026-0007.json) | hidden-unicode | high | `pepe276/moltbookagent`, `publish-dist` (ClawHub) |
| [SKA-2026-0008](SKA-2026-0008.json) | malicious-skill | critical | `twittertrends`, `proxy-scrap`, `polymarket` + 6 more, first wave (ClawHub) |
| [SKA-2026-0009](SKA-2026-0009.json) | supply-chain | medium | moltbook heartbeat skill (moltbook.com) — risky design, no malicious use reported |
| [SKA-2026-0010](SKA-2026-0010.json) | malicious-skill | critical | `moonshine-100rze/moltbook-lm8` (ClawHub) |

Primary sources: [Koi Security ClawHavoc audit](https://www.koi.ai/blog/clawhavoc-341-malicious-clawedbot-skills-found-by-the-bot-they-were-targeting),
[OpenSourceMalware](https://opensourcemalware.com/blog/malicious-clawhub-skills-target-openclaw-users),
[Snyk ToxicSkills](https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub/) and its
[technical report](https://arxiv.org/abs/2605.28588). Entries were last re-verified 2026-08-04.
