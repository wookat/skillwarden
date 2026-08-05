# GAP-ROUND-1 — 生产级对标循环 · 第 1 轮

日期：2026-08-04 · 参照物：skillgate.sh（npm `skillgate@0.2.x`，直接竞品，真实安装体验）、gitleaks / semgrep（误报治理与 ignore 机制反推）、npm audit（报告可读性）。
测试语料（全部真实公开仓库，当日 shallow clone）：anthropics/skills（18 skills）、obra/superpowers（14）、anthropics/claude-code（10）、wshobson/agents（180 skills，38k★ 插件市场）。

## 竞品实测记录

### skillgate.sh（`npx skillgate@latest`）

- `skillgate scan` 只识别 `.claude/skills/`、`.cursor/rules/` 等 8 个固定位置；对 anthropics/skills 的顶层 `skills/` 布局直接报 "No agent skill files found"（实测命令：仓库根目录 `npx skillgate scan`）。
- 无 ANTHROPIC key 时逐文件输出 `Verdict: Error / Unexpected end of JSON input`，**且 exit code 为 0** —— 门禁静默失效（fail-open）。76 文件触发 "may approach the API rate limit of 30/hour" 警告。
- 每文件一次 LLM 调用，非确定、需网络、限流 30 文件/小时；无 lockfile、无 drift、无 SARIF、无 ignore 机制。
- 结论：我们的确定性/离线/fail-closed 路线差异化成立；但它的 `install`（先审计后落盘）交互是好设计，记为 P2 借鉴项。

### gitleaks / semgrep 反推

- gitleaks：`.gitleaksignore` 指纹文件 + 占位值 allowlist 是误报治理的行业标准做法；我们此前完全没有 suppression 机制。
- semgrep：规则文档逐条给"为什么危险 + 何时误报"；我们站点规则页已具备，保持。

## 差距清单与处置

| # | 竞品/基线做到 | 我们的现状（实测） | 差距 | 级别 | 处置 |
|---|---|---|---|---|---|
| 1 | 真实生态中 38k★ 的 wshobson/agents 用 `plugins/*/skills/*` 嵌套布局 | `scan`（自动发现与显式路径）都找不到其 180 个 skills，`scan plugins` 返回 exit 2 | 主流市场布局覆盖为 0 | **P0** | 已修：发现逻辑改为递归（深度上限 10，跳过 node_modules/.git/dist），180 skills / 0.43s |
| 2 | gitleaks 有 `.gitleaksignore` 指纹 suppression | 无任何误报治理手段，文档类仓库（claude-code 的 hook 文档）无法过 `ci` 门禁 | 无法在真实仓库常驻 CI | **P0** | 已加 `.skillwardenignore`（`skill:file:ruleId[:line]` 指纹，支持 `*` 通配），JSON 输出带 `fingerprint` 字段可直接复制 |
| 3 | 误报量化：wshobson/agents 180 skills 实测 28 findings，其中 12 条明显误报（`password: "password123"` 测试夹具 ×9、keycap emoji `1️⃣` 误判 variation-selector ×1、`sudo apt-get install` ×2） | 同左 | 中等噪声 | **P0** | 已修：占位值 allowlist 扩充（password123/test_password/my-token/api-key 族/…）、keycap 序列白名单、`sudo <包管理器> install` 降噪、私钥块要求真实 base64 体；28→11 findings，剩余 11 条逐条复核均为值得人工复核的真实模式（curl\|bash 安装、env 秘钥出网、/dev/mem 读取等） |
| 4 | 语义化文案 | `11 variation-selector sequence (invisible data smuggling)s found` 复数拼接错误 | 报告可读性 | P1 | 已修：`<name> ×<count>` 格式 |
| 5 | `you MUST call the search tool` 被判 prompt-injection medium（anthropics/skills claude-api 文档） | 同左 | 误报 | P1 | 已修：demand 模式收窄到 run/execute（shell 执行），保留攻击语义 |
| 6 | skillgate 的 `install`（先审计后安装）工作流 | 只有事后 scan | 安装时守门缺失 | P2 | 记入 ROADMAP，下一轮评估 `skillwarden add <source>` |
| 7 | semgrep `--sarif` 有规则级 help URI | SARIF 已有 helpUri，保持 | — | — | 无动作 |

## 遗留的有意判定（非误报）

- anthropics/skills `claude-api`：官方 GitHub releases 的 `curl | sudo tar -C /usr/local/bin` 保持 medium —— 管道到 sudo 本身就是值得复核的模式，用户可用 ignorefile 指纹豁免。
- wshobson/agents 剩余 11 findings（linkerd/flux/uv 的 `curl|bash` 安装、web3 skill 的 env 秘钥出网、memory-forensics 的 `sudo dd if=/dev/mem`）：全部为真实危险模式，安全产品应当报告，由用户决定豁免。

## 回归结论（新用户身份，干净目录，npx）

- `npx skillwarden scan` 在 4 个真实仓库全部一次成功；180-skill 仓库 0.43s（对比 skillgate：30 文件/小时限流 + 需 API key）。
- 诚实回答「实际体验能像最好的竞品一样优秀吗」：**规则质量、速度、覆盖、误报治理已优于直接竞品 skillgate.sh（其门禁在无 key 时 fail-open）；相对 gitleaks 这类成熟扫描器，仍缺 inline 注释豁免（`# skillwarden:ignore`）与 baseline 模式，列入下一轮**。

## ROUND-2 计划

1. inline 豁免注释 + `--baseline` 模式（对齐 gitleaks/semgrep 的存量治理）。
2. 评估 `skillwarden add <source>`（安装时守门，对齐 skillgate install 与 socket.dev 的 install-time 拦截）。
3. Windows 路径兼容性验证（POSIX 分隔符断言已埋点）与 Node 22/24 双版本 CI 矩阵。
