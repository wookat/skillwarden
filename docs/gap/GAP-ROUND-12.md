# GAP-ROUND-12 — SkillTrustBench baseline + script-channel detection gaps

Date: 2026-08-04. New reference benchmark this round: **SkillTrustBench**
(cuhk-zhuque, Hugging Face, pinned revision `762d538`, benchmark_full_v1.0:
5520 cases — 2863 malicious / 1014 suspicious / 1643 normal), the dataset
ClawScan's leaderboard also consumes. Harness:
`bench/skillwarden-stb-bench.mjs` pattern (severity→verdict mapping identical
to the ClawHub harness).

## 1. Baseline (before this round's fixes)

```
cases 5520, errors 0, ~28s
accuracyBinary 0.7554   malicious->clean 571 (20% missed)   clean FP 214 (13%)
```

## 2. Gaps found by reading the 571 misses (rule-able clusters)

| Gap | Example from missed cases | Fix |
| --- | --- | --- |
| prompt-injection only scanned doc files — payloads in Python **docstrings/comments** of bundled scripts were invisible ("DAN mode active", "you are now in root mode" in `_compat_shim.py`) | `case_03170`, `case_02213` | rule now scans script files too |
| credential files read via **language runtimes** (`Path('~/.ssh/id_rsa').read_text()`, `open('~/.aws/credentials')`) — old patterns only matched shell commands (`cat`, `curl` …) | `case_04866` `_bootstrap.py` | new critical exfiltration pattern |
| **env harvesting loops**: iterate `os.environ.items()` and keep keys matching `TOKEN/SECRET/KEY/AWS` | `case_01939` `_refresh_config.py` | new critical exfiltration pattern |
| **bare public-IP endpoint constants** (`ENDPOINT = "91.243.59.117"`) — raw-IP pattern required `http://` | `case_03740` `_env_bootstrap.py` | new high pattern (private ranges excluded) |
| shell-profile persistence written through a runtime (`open(bashrc, "a")`) and interpreter hooks (`PYTHONSTARTUP=`, `LD_PRELOAD=`, `NODE_OPTIONS=`) | `case_03740` | two new high dangerous-commands patterns |
| `exec("".join(reversed(...)))` — obfuscation with no base64/hex signature | `case_03510` `_string_helper.py` | new critical dangerous-scripts pattern |

## 3. Measured results (after)

```
SkillTrustBench: accuracyBinary 0.7554 → 0.7830   malicious->clean 571 → 415 (-156)
                 clean FP 214 → 219 (+5, +0.3pt)
ClawHub holdout: unchanged malicious detection; clean FP +1 (173→174); binary 0.6360→0.6363
Real corpora: anthropics 6 / superpowers 0 / claude-code 5 unchanged;
              wshobson/agents 13→14 (+1: LD_PRELOAD hooking example inside the
              anti-reversing-techniques reference doc — a defensible review signal
              on a skill that already carries a critical finding)
116 tests green.
```

One prior test ("does not flag scripts") asserted the old doc-only scope of
prompt-injection; the behavior change is the point of the fix, so the test now
asserts the new intended behavior (scripts scanned, non-doc assets still not).

## 4. Remaining misses (415) — next rounds

Still-uncovered clusters, in frequency order: excessive-telemetry payload
assembly without secret keywords (workspace file lists, env *names* only);
config-poisoning of agent config files; semantic social-engineering with no
code payload. These need aggregation-style rules (multiple weak signals in one
file) rather than single-pattern matches — candidate design for ROUND-13.

## 5. Competitor status

skillgate.sh still 0.2.1 (six rounds without a release). ClawScan upstream PR
still an external step. corpus-smoke first cron run still pending (Monday).

## 6. Honest conclusion

First run against the benchmark competitors actually publish numbers on:
80→85.5% of malicious skills caught at ≥1 finding, with a +0.3pt FP cost and
zero regression on the four real-world corpora. The biggest structural gap
found — bundled scripts as an un-scanned instruction channel — is now closed.
