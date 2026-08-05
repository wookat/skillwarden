# GAP-ROUND-15 — Install-time gating: OpenClaw install policy adapter

Date: 2026-08-04.

## 1. What triggered this round

ROUND-1 and ROUND-3 both evaluated "install-time guarding" and deferred it as
P2 "until a real host protocol exists". That condition is now met: OpenClaw
ships an external `security.installPolicy.exec` boundary (protocol v1 —
staged-install JSON request on stdin, allow/warn/block JSON response on
stdout), and ClawScan already ships an adapter for it (openclaw/clawscan #35,
`docs/openclaw-install-policy.md`). A gate that only runs in CI misses the
attack that matters most for end users: the moment a skill from a marketplace
is installed into a personal agent.

## 2. Competitor reference (ClawScan, verified from source 2026-08-04)

- `internal/installpolicy/policy.go`: protocol v1 request validation
  (256 KiB cap, targetType skill/plugin, sourcePathKind file/directory),
  response `{protocolVersion, decision, reason?, findings?}` with findings
  capped at 100.
- Their default profile composes SkillSpector + clawscan-static inside a
  Docker sandbox; decision derives from scanner severities.
- Deployment caveat they document: `decision: "warn"` requires a host that
  supports pausing for user confirmation; older hosts fail closed on it.

## 3. What we shipped

`skillwarden openclaw-install-policy` (CLI, no new dependencies):

- protocol v1 request from stdin (same 256 KiB cap), response on stdout;
- decision from the existing rule engine: `--block-on` (default `high`) /
  `--warn-on` (default `medium`);
- **fail-closed**: invalid/oversized requests, unreadable staged paths, and
  staged paths without a `SKILL.md` all answer `block` with a reason — never
  a silent allow on error;
- `targetType: "plugin"` answers `warn` honestly (we analyze skills, not
  plugin packages) instead of pretending to scan;
- `.skillwardenignore` applies, so the documented official-API-wrapper FP
  pattern does not block installs;
- findings capped at 100, evidence is `file:line` only (no snippet leakage
  into host logs);
- docs: site page + CLI contract spec section; changeset (minor).

Difference from ClawScan's adapter: ours needs no Docker, no scanner
composition, no judge — one offline binary, sub-second decisions. That is the
same speed/simplicity differentiation as the rest of the product.

## 4. Verified

- 12 CLI tests green (3 new: allow/block round-trip, fail-closed trio,
  plugin warn); 121 core tests unchanged.
- End-to-end via real stdin against `examples/skills/malicious-skill`
  (block, 8 findings with `file:line` evidence) and `benign-skill` (allow).
- Site builds (25 pages), spec updated.

## 5. Honest limits

- OpenClaw's `warn` decision requires a host release that supports it; on
  older hosts a `warn` fails closed — acceptable for a security gate.
- Not yet tested against a live OpenClaw Gateway (external resource: needs a
  host environment); the protocol shapes are implemented from ClawScan's
  published validation code, which is the reference implementation.
- Plugin scanning remains out of scope by design.

## 6. Next candidates

- Live OpenClaw Gateway integration test once a host environment is available.
- Rebase the ClawScan adapter branch (upstream added gate policy + install
  policy since) — still waiting on the boss account for the upstream PR.
- Remaining SkillTrustBench misses (228) are semantic-only; no new
  deterministic clusters identified this round.
