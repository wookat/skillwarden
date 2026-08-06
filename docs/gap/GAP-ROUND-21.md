# GAP-ROUND-21 — SkillTrustBench false-positive cluster analysis: Chinese CLI help text

Date: 2026-08-04
Focus: user/data analysis — drilling into the 120 `clean -> malicious` SkillTrustBench
misclassifications for real-world false-positive patterns worth fixing.

## 1. What was actually run

- Fresh SkillTrustBench run (pinned revision `762d5388b3a047b26df9679582af868a0e5b2c8f`,
  5520 cases) on the post-#46 build: binary accuracy 0.8168, `malicious->clean` 228,
  0 errors — identical to the ROUND-13 baseline, confirming the ROUND-19 domain
  indicators introduced no metric drift.
- Grouped the 120 `clean -> malicious` cases by dataset labels: 51 `FP_TEST_FIXTURE`,
  8 `FP_BENIGN_SUSPICIOUS`, 2 `FP_SECURITY_TOOL`, 59 unlabeled.
- Manually inspected unlabeled cases and re-scanned them with the built CLI to see
  which rule/pattern fired and on what text.

## 2. Finding: bare 跳过确认 fires critical on legitimate CLI help text

`case_03515` (judged clean) is a Chinese note-taking skill whose only findings were
four critical `prompt-injection` hits from the pattern
`(绕过|跳过|关闭|禁用|规避)(所有|全部|任何)?(安全|权限|确认|审核|检查|限制|沙箱)`,
all matching benign CLI documentation and argparse help strings:

```text
# 删除单个文件（--force 跳过确认）
p_delete.add_argument("--force", action="store_true", help="跳过确认")
log("非交互模式下必须使用 --force 参数跳过确认")
```

"--force 跳过确认" ("--force skips the confirmation prompt") is the standard way to
document a force flag in Chinese CLI help — this is a real-world false-positive
class, not a benchmark artifact. Cross-checking the full dataset: 9 cases contain
text matching the pattern; the malicious ones among them either carry other
critical findings or match the same benign help strings incidentally.

## 3. Fix

Split the pattern by signal strength:

- **critical** (unchanged intent): `绕过/规避` + any object, or `跳过/关闭/禁用` +
  quantifier (所有/全部/任何) or strong object (安全/权限/审核/限制/沙箱).
- **medium** (new): bare `跳过/关闭/禁用` + `确认/检查` — still surfaced, still
  warns under the default install-policy `--warn-on medium`, but no longer blocks
  the default `--fail-on high` gate on its own.

## 4. Regression results

- 136 unit tests green (new test pins both severities).
- Four real corpora unchanged: anthropics-skills 6 / superpowers 0 /
  wshobson-agents 14 / claude-code 5.
- SkillTrustBench: binary accuracy 0.8168 (unchanged), `clean->malicious` 120→119,
  `suspicious->malicious` 294→292 (moved to suspicious, still non-clean),
  `malicious->clean` 228 (unchanged — no detection lost to clean).

## 5. Remaining known gaps (unchanged)

- 228 semantic `malicious->clean` cases (social engineering / capability risk) —
  out of scope for a deterministic gate; documented since ROUND-13.
- `FP_TEST_FIXTURE` cluster (51 cases): scanners are *expected* to flag fixture
  payloads; the dataset judges them clean by context. No change planned —
  fail-closed is the product stance, `.skillwardenignore` is the escape hatch.
- corpus-smoke first scheduled run: 2026-08-10 06:17 UTC.
- External: npm Trusted Publisher, Cloudflare secrets, upstream clawscan PR,
  bestpractices.dev.
