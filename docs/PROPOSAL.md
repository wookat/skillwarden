# 项目一页纸：SkillWarden — Agent Skills 安全与供应链门禁（开源）

## 背景与洞察（2026-08-04 调研结论，SOP-02 核实）

- Agent Skills（`SKILL.md`）已成为跨产品事实标准：Claude Code / OpenClaw / Codex / Gemini CLI / Cursor / Copilot 等 30+ 产品支持，社区 registry（skills.sh、skillmd.com、agentskills.io、tech-leads-club/agent-skills 4.9k★）日均新增数千 skills。
- Skill 是"可执行的上下文"：注入进 agent 会话，能改变 agent 行为、携带可执行脚本。Snyk 已随 Agent Scan 0.4 发布 skills 生态威胁技术报告（提示注入、隐藏 Unicode、恶意载荷藏在自然语言中）——威胁已被头部安全厂商确认，事实核查见 [COMPARISON.md](COMPARISON.md)。
- 竞品格局（逐项读码核实）：质量 lint 阵营（skill-tools、skill-check、skillmds）只做规范/质量分；安全阵营只有两个——Snyk Agent Scan（需云账号、Python、无 lockfile/门禁）与 loris-fo 的 `skillgate` npm 包（LLM 云审计、需调 skillgate.sh API、0★、非确定性）。**没有任何工具做 skills 的 lockfile 内容锁定 + CI 漂移门禁 + 公开 advisory 数据库。**
- 姊妹项目 AgentGate 已在 MCP 侧验证了「scan → lock → gate → advise」闭环模式，工程资产（monorepo/CI/发布/文档站）可直接复用。

## 定位

SkillWarden：Agent Skills 时代的 `npm audit + package-lock`。本地确定性规则（无 LLM、无云账号、离线可用）：
扫描（提示注入 / 隐藏 Unicode / 恶意命令 / 凭证泄露 / 危险脚本 / 数据外传）→ 锁定（skill 全部文件内容哈希进 `skillwarden.lock`，防 rug-pull）→ 门禁（CI 漂移或高危发现即红）→ 通报（公开结构化 advisory 数据库比对）。与 AgentGate 组成「Gate 家族」。

## 差异化（vs 竞品逐项，详见 COMPARISON.md）

1. **安全视角**（skill-tools/skill-check/skillmds 是质量视角，安全只占一小格）；
2. **lockfile + 漂移门禁**（全生态无人做：一个已批准的 skill 上游悄改内容，现有所有工具都看不见）；
3. **确定性 + 离线**（Snyk 要账号，loris-fo skillgate 要云 LLM API；我们纯本地规则，CI 友好、可复现）;
4. **公开 advisory DB**（无人有）；5. **多生态统一发现**（.claude/.agents/.codex/.gemini/.opencode/.cursor 等目录自动发现）。

## 命名核实（AgentGate 教训）

第一轮核实：`npm view skillgate` → **已被占用**（loris-fo，0.2.1，同方向产品，skillgate.sh 云 LLM 审计）。第二轮核实（2026-08-04 改名）：npm 判重会去掉连字符，`skill-gate` 会因 `skillgate` 存在而被 403 拒绝；且 skillgate.sh 为在营同领域产品，品牌不可对外沿用。最终定名 **SkillWarden**：npm 包名 **`skillwarden`**（CLI，安装命令 `skillwarden`）与 **`skillwarden-core`**（引擎），`skillwarden`/`skill-warden`/`skill_warden`/`skillwarden-core` 全部核实 404 可用（2026-08-04），GitHub 仓库已改名 `wookat/skillwarden`。README 顶部显著说明与 loris-fo/skillgate（skillgate.sh）无关并链接对比。

## 技术选型（公司原则：最新主流、不造轮子）

TypeScript + Node 22 + pnpm + vitest；commander / picocolors / cli-table3 / zod（与 AgentGate 同栈）；SARIF 输出接 GitHub code scanning；GitHub Action（composite）；文档站 Astro Starlight + Cloudflare Pages；Apache-2.0。

## 里程碑

- M1：仓库 + 骨架 + PROPOSAL/COMPARISON + scan 六类规则最小闭环（本 PR）。
- M2：lock/diff/ci + lockfile v1 规范 + GitHub Action + advisory DB v1。
- M3：文档站上线（pages.dev，域名 skillwarden.zalize.com 由总负责人后配）+ MATURITY 清单对齐 AgentGate + 竞品对比复核达标 → 验收包。

## 资源缺口（一次性申报，不阻塞）

- npm 发布：复用 org 的 `NPM_PUBLISH_TOKEN`（需确认该 granular token 允许发布新包 `skillwarden`/`skillwarden-core`；不允许则需老板放宽 scope）。发布动作等总负责人指令，此前 `pnpm publish --dry-run` 验证。
- 域名 `skillwarden.zalize.com`（总负责人已知，先用 pages.dev）。
- 无其他缺口：全流程离线、无第三方 API。

如无异议将按此执行。
