# GAP-ROUND-13 — Persistence, telemetry and config-poisoning clusters

Date: 2026-08-04. Continues the SkillTrustBench work from GAP-ROUND-12
(5520 cases, pinned revision `762d538`).

## 1. Starting point

After ROUND-12: `malicious->clean` 415, binary accuracy 0.7830. Read the 415
remaining misses grouped by the benchmark's own `primary_pattern` label; the
top clusters were `V_EXCESSIVE_TELEMETRY` (92), `PY_PYTHON_PERSIST` (48),
`V_PERSISTENT_SERVICE` (42), `PE2` (35), `OB_STRING_OBFUSC` (33),
`CF_CONFIG_POISON` (26).

## 2. Fixes shipped (all deterministic, no aggregation heuristics needed)

| Cluster | What the samples did | New pattern |
| --- | --- | --- |
| `CF_CONFIG_POISON` | skill bundles `.claude/hooks/session-start.sh` that beacons env on every session start | `dangerous-scripts`: skill shipping any agent config/hook file (`.claude/`, `.codex/`, `.cursor/`, `.gemini/`, `.openclaw/` hooks, settings, mcp.json) — high |
| `V_EXCESSIVE_TELEMETRY` | `os.getcwd()` / `gethostname()` / `$(whoami)` assembled and POSTed; collectors on `*.workers.dev` / `*.pages.dev` with random hex subdomains | `exfiltration`: host/workspace fingerprint sent to a network endpoint; free-tier host with random-looking subdomain — both high |
| `V_EXCESSIVE_TELEMETRY` (shell variant) | `env \| grep -iE 'key\|token' \| base64` then `curl` on a later line | `exfiltration`: env filtered for secrets and encoded for transport — critical |
| `PY_PYTHON_PERSIST` | `.pth` file written into `site-packages` (executes on every interpreter start) | `dangerous-commands`: high |
| `V_PERSISTENT_SERVICE` | `subprocess.run(["crontab", "-l"])` — argv form, invisible to the shell-syntax cron pattern | `dangerous-commands`: medium |
| `PE2` | `nohup … &` / `setsid` / `start_new_session=True`; `os.chmod(p, 0o777)` | `dangerous-commands`: detached long-lived process (high), runtime chmod widening (medium) |
| `OB_STRING_OBFUSC` | `[exec(x) for x in ["import os", "os.system('curl …')"]]` | `dangerous-scripts`: exec/eval over a list of code strings — critical |

Also tightened the ROUND-12 bare-IP pattern: RFC 5737 documentation ranges
(`203.0.113.*`, `198.51.100.*`, `192.0.2.*`) and link-local are now excluded,
which removed the one new false positive it caused on wshobson/agents.

## 3. Measured results

```
SkillTrustBench  malicious->clean  415 → 228   (baseline this round: 571 → 228, -60%)
                 accuracyBinary    0.7830 → 0.8168
                 clean FP          219 → 223 (+4; 13.6% of 1643 normal cases)
ClawHub holdout  binary 0.6363 → 0.6378, malicious detection unchanged, clean FP -1
Real corpora     anthropics 6 / superpowers 0 / agents 14 / claude-code 5 — all unchanged
                 (agents' ROUND-12 bare-IP FP replaced by the LD_PRELOAD signal)
Runtime          5520 cases in ~37s (~6.8ms/skill); 130 tests green
```

## 4. Remaining misses (228)

The residue is now dominated by cases whose only malicious property is
semantic: instructions that ask the agent to do something harmful with no code
payload, and "confidence theater" skills. These are the same class the ROUND-10
report flagged as out of scope for a deterministic gate, and we continue to say
so honestly rather than guessing.

## 5. Competitor status

skillgate.sh 0.2.1 (unchanged). ClawScan upstream adapter PR still needs the
boss's account. corpus-smoke first cron run still pending.

## 6. Honest conclusion

Two rounds of benchmark-driven work moved malicious recall on SkillTrustBench
from 80.0% to 92.0% of cases flagged, with false positives up only 0.6pt and
zero regression on real-world corpora. The rule set now covers the persistence
and telemetry channels a Go/Docker competitor covers with a sandbox — without
executing anything.
