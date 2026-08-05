# GAP-ROUND-6 — 生产级对标循环 · 第 6 轮

日期：2026-08-04 · 参照物：ClawScan（@openclaw/clawscan 0.1.6，本地真实运行）、ClawHub security-signals 公开数据集（3368 例 eval_holdout 实测）、@panguard-ai/panguard-skill-auditor 1.8.26（本地真实运行）。

## 生态重大变化（本轮最重要情报）

skills 安全扫描已从「无人做」变成**多厂商赛道**：ClawScan 收录 8 个扫描器 —— NVIDIA SkillSpector、Cisco AI Defense skill-scanner、Tencent AI-Infra-Guard、Snyk Agent Scan、Socket CLI、AgentVerus、VirusTotal、内置 clawscan-static，并有两个公开 benchmark（clawhub-security-signals 周更、CUHK SkillTrustBench）。skillgate.sh 已停更（0.2.1，2026-03）。**SkillWarden 不在 ClawScan 扫描器目录中。**

## 参照物实测记录

### ClawScan 0.1.6

- `clawscan benchmark clawhub-security-signals --scanner clawscan-static`：3339 例，accuracy 0.9550（其自报评分）。
- 架构：多扫描器聚合 + 可插拔 LLM judge（Codex gpt-5.5）+ Docker 沙箱运行扫描器；自定义 profile 走 `.clawscan.yml`，但**扫描器目录是内置白名单**（新增需上游 PR，见其 docs/scanners.md）。

### panguard-skill-auditor 1.8.26

- `--dir skills --fleet` 实测 anthropics/skills：62s（我们 0.6s，约 100×）；`--json` 输出为空数组（fleet+json 组合疑似 bug）；无 LLM 时打印大量 "AI check skipped" 噪音；把 `localhost` 引用报为 external domain（误报）。CLI 契约与我们高度相似（--fail-on/exit 0,1,2——行业收敛信号）。

### SkillWarden 在 ClawHub eval_holdout 上的真实成绩（scripts/bench/clawhub-holdout.mjs）

- 3368 例 4.2s 全部扫完（0 错误）。标签分布 clean 2119 / suspicious 1241 / malicious 8。
- 映射 critical→malicious、high/medium→suspicious、low/无→clean：**3-class accuracy 0.60，binary(clean vs 非clean) 0.63**。
- 混淆细节：8 例 malicious 检出 2 漏 6（漏报在 bundle 深层/语义类攻击）；1241 例 LLM 判 suspicious 我们只标 79（其"suspicious"多为能力风险如「可删除线上数据」，确定性规则有意不建模）；121 例 LLM 判 clean 被我们标 malicious，其中 510 个 critical findings 集中在 exfiltration 规则（API 型 skill 把自家 env token 发给自家官方 API，如 NOTION_TOKEN→api.notion.com）。
- 结论必须诚实：这不是同口径 leaderboard（clawscan-static 0.955 的评分口径未公开，其预测 95% 为 clean），但**FP/FN 画像是真实的**。

## 差距清单与处置

| # | 参照物做到 | 我们的现状（实测） | 差距 | 级别 | 处置 |
|---|---|---|---|---|---|
| 1 | ClawScan 生态入口（8 扫描器目录 + 周更公开 benchmark） | 不在目录中 | 生态位缺席 = 可见性与可信度损失 | **P0（外部）** | 按其 docs/scanners.md 提交 adapter PR 至 openclaw/clawscan（需上游接受，列为 ROUND-7 首项） |
| 2 | 公开数据集量化 FP/FN | 此前只有 4 个真实仓库人工复核 | 误报画像缺少规模化数据 | **P1（已做）** | benchmark harness 入库 scripts/bench/，本轮基线数字写入本报告，后续每轮复跑对比 |
| 3 | LLM judge 能力风险建模（suspicious 类） | 有意不做（离线确定性） | 对「合法但高权限」skill 无风险分级 | P2 | 维持定位：我们是 gate（fail-closed 确定性），不是 advisor；文档已明确边界 |
| 4 | — | exfiltration 规则对 API 型 skill 自家 token→官方 API 场景产生集中 FP（121 skills/510 findings） | 真实误报模式 | **P1（决策项）** | 降级方案有安全代价（域名可被攻击者自声明），不擅自改；连同证据提交总负责人决策：维持 critical（现状，靠 ignore 豁免）vs 场景化降 high |
| 5 | panguard 的 fleet 模式 62s/20 skills、fleet+json 空输出 | 我们 0.6s 且 JSON 稳定 | 无 | — | 竞争优势记录在案 |

## 回归结论

- 速度与稳健性优势经第三方语料再次确认（3368 例 4.2s 0 错误）。
- 诚实回答：确定性 gate 在 LLM-judged「能力风险」类标签上天然低分，这是定位差异不是缺陷；但 6/8 malicious 漏报与 API-token FP 模式是真实短板，前者需要 bundle 深层脚本语义规则增强（ROUND-7 候选），后者待决策。

## ROUND-7 计划

1. 向 openclaw/clawscan 提交 SkillWarden adapter PR（生态入口，P0）。
2. 分析 6 例 malicious 漏报的具体攻击手法，补确定性规则（用 train split 做规则开发、eval_holdout 只做验收，避免过拟合）。
3. exfiltration FP 决策落地（等总负责人）。
4. corpus-smoke 周一 cron 首跑观察。
