# Benchmarks

## ClawHub security-signals eval_holdout

Runs SkillWarden's rule engine over the public
[OpenClaw/clawhub-security-signals](https://huggingface.co/datasets/OpenClaw/clawhub-security-signals)
dataset (LLM-judged verdicts: clean / suspicious / malicious) and reports
3-class and binary accuracy plus a confusion matrix.

```bash
# 1. Export the split to JSONL (requires python + `pip install datasets`)
python3 - <<'EOF'
from datasets import load_dataset
import json
ds = load_dataset("OpenClaw/clawhub-security-signals", split="eval_holdout", verification_mode="no_checks")
with open('/tmp/holdout.jsonl', 'w') as f:
    for r in ds:
        f.write(json.dumps({'id': r['id'], 'md': r['skill_md_content'], 'bundle': r['skill_bundle_content'], 'verdict': r['clawscan_verdict']}) + '\n')
EOF

# 2. Run the harness (from a directory with skillwarden-core installed)
node scripts/bench/clawhub-holdout.mjs
```

## CUHK SkillTrustBench

Runs the rule engine over
[cuhk-zhuque/SkillTrustBench](https://huggingface.co/datasets/cuhk-zhuque/SkillTrustBench)
`benchmark_full_v1.0` (5520 real skill directories labelled malicious /
suspicious / normal, each with the attack pattern that makes it malicious).

```bash
REV=762d5388b3a047b26df9679582af868a0e5b2c8f
BASE=https://huggingface.co/datasets/cuhk-zhuque/SkillTrustBench/resolve/$REV
curl -sL -o /tmp/stb.zip "$BASE/benchmark_full_v1.0.zip"
curl -sL -o /tmp/stb_cases.jsonl "$BASE/data/test_cases.jsonl"
unzip -q -o /tmp/stb.zip -d /tmp/stb

node scripts/bench/skilltrustbench.mjs   # override paths with STB_ROOT / STB_CASES
```

The harness writes per-case predictions to `/tmp/sw-stb-predictions.json`;
grouping the misses by the dataset's `primary_pattern` field is how ROUND-12 and
ROUND-13 found the detection clusters recorded in `docs/gap/`.

Caveats when interpreting results: the dataset's verdicts are produced by an
LLM judge that models *capability risk in context* (e.g. an API skill that can
delete live data is "suspicious"), which a deterministic pattern gate
intentionally does not model. Treat the numbers as a false-positive/negative
profiling tool, not a leaderboard. Baseline numbers per round live in
`docs/gap/`.
