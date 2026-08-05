# GAP-ROUND-9 — advisory 数据库从「文档」变成「检测能力」

日期：2026-08-05 · 参照物：osv-scanner / npm audit（known-vulnerability 匹配模式）、ClawScan（生态动向）

## 竞品动向复测（证据）

- ClawScan：`b4d4470e`（2026-08-03）为最新 commit；新增 declarative JSON gate policy（#34）与
  OpenClaw install policy adapter（#35）。我们的 `feat/skillwarden-scanner` 分支已基于最新
  main（merge-base = origin/main），上游 PR 等待老板账号操作。npm `@openclaw/clawscan`
  仍为 0.1.6。
- skillgate.sh：npm `skillgate` 仍 0.2.1（2026-03 后停更），连续四轮无迭代。
- corpus-smoke cron：workflow active，至今 0 runs（合入晚于上周一触发点）；下周一 06:17 首跑。

## 0.4.0 发布回归（证据）

- `npx skillwarden@0.4.0` 干净环境 scan/lock/ci 全链路通过。
- 四语料仓库与 ROUND-7 数字一致：anthropics-skills 20/6、superpowers 14/0、agents 180/11、
  claude-code 10/5。
- ClawHub eval_holdout：3368 例 / 0 错误 / ~4.5s / accuracy3 0.6036 / accuracyBinary 0.6351
  （与 ROUND-7 本地开发版一致，发布无回退）。

## 本轮差距：advisory DB 不被 scanner 消费

| 竞品做到了什么 | 我们现状 | 差距 | 优先级 |
| --- | --- | --- | --- |
| osv-scanner/npm audit：known-vulnerability 数据库是核心检测能力，离线/在线匹配 | 20 条 SKA advisory 只是仓库文档，`skillwarden scan` 完全不读取 | 用户装了一个已被公开记录为恶意的 skill 同名复刻，SkillWarden 不告警 | **P0（本轮修复）** |

### 修复（本轮 PR）

新规则 `known-advisory`（第八类）：

- `scripts/generate-advisory-data.mjs` 从 `advisories/SKA-*.json` 生成名称索引
  （64 个非通用名），构建时打进 `skillwarden-core`，离线可用；CI 新增 freshness check。
- schema 新增 `genericName`，排除 `update`/`simple`/`clawhub` 等普通 skill 可能撞名的条目，
  控制误报。
- 命中输出 advisory ID + 标题 + 链接，severity 继承 advisory；明确标注是 name-based match，
  合法同名可走 `.skillwardenignore` 复核豁免流程。

### 验证

- 105 core 测试通过（新增 3 例）；SARIF snapshot 更新。
- 真实语料：仅 wshobson/agents 新增 1 命中 —— `brand-landingpage`，恰是 SKA-2026-0017
  记录的真实恶意 skill（真阳性，不是误报）；其余三仓库 0 新增。
- holdout 数字不变（数据集目录名为哈希，name-based 规则无影响，符合预期）。

## 残余差距（下一轮候选）

- 重命名复刻检测：advisory `digest` 字段已在 schema 中，但已收录条目多数无法回取恶意内容
  哈希；有内容时可做 digest 匹配（P2，数据受限）。
- suspicious→clean 1052 例主要是 LLM 标签的语义级判断，超出确定性规则定位（维持边界）。

## 诚实回归结论

「装到已知恶意 skill 的同名复刻会不会被警告」这一体验此前不如 npm audit/osv-scanner，
本轮补齐且离线可用；真实语料验证命中了一个真实的已记录恶意 skill。等待项（上游 adapter
PR、cron 首跑、Trusted Publisher）不受本轮影响。
