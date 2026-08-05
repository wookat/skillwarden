# GAP-ROUND-5 — 生产级对标循环 · 第 5 轮

日期：2026-08-04 · 参照物：semgrep 1.172.0（本地真实安装运行）、npm trusted publishing（发布工程对标）。
（ROUND-4 为发布/自评收尾轮：0.3.0 发布验证、OpenSSF 本地自评 docs/OPENSSF-SELF-ASSESSMENT.md，无独立 GAP 文档。）

## 参照物实测记录

### semgrep 1.172.0（真实运行）

- `pip install semgrep` 后在真实语料实测：anthropics/skills 6.1s、wshobson/agents 4.6s（`--config p/secrets`，需联网拉取规则；我们离线 0.66s 扫 180 skills）。
- `--config auto` 与 `--metrics=off` 互斥（隐私换便利）；免费 registry 规则集偏保守（`p/python` 151 条未报 `subprocess shell=True`），更多规则要 `semgrep login`。
- `--baseline-commit HEAD` 实测：无当前 findings 时跳过 baseline 扫描，有 baseline 时只扫变更文件 —— 本质是「按 git 变更缩小扫描面」。
- 输出 UX：结构化 Scan Summary 面板（Findings/Rules run/Targets/Parsed lines）+ 漏报反馈链接。

## 差距清单与处置

| # | 参照物做到 | 我们的现状（实测） | 差距 | 级别 | 处置 |
|---|---|---|---|---|---|
| 1 | npm 生态最佳实践：OIDC trusted publishing + provenance，发布无长期 token | 0.2.0/0.3.0 由维护者手动 token 发布；CI 发布曾因 OIDC 交换 404 + npm 10 双重阻断 | 发布供应链短板（我们自己就是供应链安全产品） | **P0** | 本 PR：release workflow 安装 npm 11（OIDC 需 ≥11.5.1）+ docs/RELEASING.md 列出 npmjs 侧 Trusted Publisher 配置外部步骤 |
| 2 | semgrep baseline 只扫 git 变更 | 无 baseline；但 `skillwarden diff`（锁文件对比）+ `.skillwardenignore` 已覆盖「只关心新增风险」的核心诉求 | 弱 | P2 | 维持 ROUND-2 结论：真实需求出现前不加 |
| 3 | semgrep Scan Summary 面板 + 漏报反馈引导 | 汇总仅一行 ✓/✗ | 可用性细节 | P2 | 现有单行汇总在 CI 日志里更紧凑；detection-gap issue 模板已承担漏报反馈入口，暂不改 |
| 4 | semgrep 规则云端持续更新 | 规则随包版本发布 | 更新时效 | P2 | 有意保持离线确定性（核心卖点）；规则更新走 npm 版本 + 每周 corpus-smoke 验证 |

## 回归结论

- 本轮聚焦发布工程 P0；扫描行为无变化，CI 全绿（含 OS×Node 矩阵）。
- 诚实回答：发布供应链在 npmjs 侧开关打开前仍依赖人工 token，是当前与最佳实践的唯一实质差距；扫描速度/离线性/豁免闭环对 semgrep 无劣势，规则广度不如其云端 registry 但领域聚焦（skills 威胁模型）是有意取舍。

## ROUND-6 计划

1. npmjs 侧 Trusted Publisher 开关（外部步骤）完成后，用一次真实 changeset 发布验证全自动链路。
2. corpus-smoke 首次 cron 运行结果观察与误报回归。
3. 竞品动态：skillgate.sh 已停更（0.2.1，2026-03），改为跟踪 Anthropic 官方 skills 生态动向与新出现的同类工具。
