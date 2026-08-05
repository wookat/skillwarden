# OpenSSF Best Practices — 本地自评（passing 级）

日期：2026-08-04 · 对象：skillwarden / skillwarden-core 0.3.0 · 状态：**本地自评**，尚未在 bestpractices.dev 正式登记（需要账号，已列为外部资源待总负责人提供）。

逐条对照 [passing 级标准](https://www.bestpractices.dev/en/criteria/0)。仅记录可核实证据；不确定的标为 Unmet。

## Basics

| 标准 | 状态 | 证据 |
|---|---|---|
| description_good | Met | README 首段 + https://skillwarden.zalize.com |
| interact | Met | GitHub Issues 开启，含 bug/detection-gap 模板 |
| contribution | Met | CONTRIBUTING.md |
| contribution_requirements | Met | CONTRIBUTING.md（PR + CI 要求） |
| floss_license / license_location | Met | MIT，根目录 LICENSE |
| documentation_basics / documentation_interface | Met | README quick start（真实可跑）+ docs/spec/cli-contract.md |
| sites_https | Met | GitHub + zalize.com 均 HTTPS |
| discussion | Met | GitHub Issues/PRs |
| english | Met | 代码/README/站点为英文（内部报告中文不影响对外文档） |
| maintained | Met | 活跃提交与 release |

## Change Control

| 标准 | 状态 | 证据 |
|---|---|---|
| repo_public / repo_track / repo_distributed | Met | 公开 GitHub 仓库 |
| version_unique / version_semver | Met | changesets + semver（0.2.0 → 0.3.0） |
| version_tags | Met | v0.2.0、v0.3.0 tags |
| release_notes / release_notes_vulns | Met | GitHub Releases 含分类变更说明；暂无已修复漏洞记录 |

## Reporting

| 标准 | 状态 | 证据 |
|---|---|---|
| report_process / report_tracker | Met | SECURITY.md + GitHub Issues |
| vulnerability_report_process / _private | Met | SECURITY.md（GitHub private vulnerability reporting） |
| report_responses / vulnerability_report_response | Met（暂无历史） | 尚无外部报告；SECURITY.md 承诺响应时限 |

## Quality

| 标准 | 状态 | 证据 |
|---|---|---|
| build / build_common_tools | Met | pnpm + tsc |
| test | Met | vitest，108 tests |
| test_invocation | Met | `pnpm test` |
| test_most / test_continuous_integration | Met | core 覆盖率门禁 ≥90% stmts + CI 每 PR 运行 |
| test_policy / tests_are_added / tests_documented | Met | CONTRIBUTING.md + PR 模板 checklist |
| warning_flags / warnings / warnings_fixed | Met | eslint + tsc strict，CI 门禁 |

## Security

| 标准 | 状态 | 证据 |
|---|---|---|
| know_secure_design / know_common_errors | Met | advisories/ 威胁模型文档 + 规则引擎针对注入/泄露/提权等常见错误类别设计 |
| no_leaked_credentials | Met | GitGuardian CI 检查 |
| crypto_* | N/A/Met | 仅用 Node 内建 SHA-256 做内容哈希（非密码用途声明于 spec） |
| delivery_mitm | Met | npm over HTTPS |
| vulnerabilities_fixed_60_days / _critical_fixed | Met（暂无） | 无已知未修漏洞 |
| static_analysis | Met | eslint + typescript strict + osv-scanner 依赖自查（0 issues @699 deps，见 GAP-ROUND-3） |
| dynamic_analysis | Unmet | 无 fuzzing；对纯文本解析器价值有限，列入 backlog |

## 结论

passing 级除 `dynamic_analysis`（建议项，非必需）外全部满足。正式登记 bestpractices.dev 只差账号（外部资源）。
