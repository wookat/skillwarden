# GAP-ROUND-3 — 生产级对标循环 · 第 3 轮

日期：2026-08-04 · 参照物：osv-scanner 2.2.4（本地真实安装运行）、npm audit / gitleaks 的发布工程与平台矩阵实践。

## 参照物实测记录

### osv-scanner 2.2.4（真实运行）

- 单二进制下载即用，`osv-scanner scan source -r .` 对本仓库 pnpm-lock.yaml 解析出 699 个依赖包、28ms 完成、"No issues found"（顺带完成了我们自身的依赖漏洞自查）。
- 其 release 工程为多平台（linux/darwin/windows × amd64/arm64）预编译产物 + CI 矩阵验证 —— 平台兼容是测出来的，不是声明出来的。

## 差距清单与处置

| # | 参照物做到 | 我们的现状（实测） | 差距 | 级别 | 处置 |
|---|---|---|---|---|---|
| 1 | osv-scanner/gitleaks 在多 OS × 多版本 CI 矩阵上验证 | 只在 ubuntu + Node 22 上测过；README 未声明平台支持范围但代码含 Windows 路径处理（`split('\\')`）从未被真实验证 | 生产级基线第 6 条（兼容性）无证据 | **P0** | 已加 CI `test-matrix`：ubuntu/windows/macos × Node 22/24（含 build/test/dogfood），平台支持从"应该行"变成 CI 证据 |
| 2 | 成熟扫描器用真实语料持续回归防误报回退 | ROUND-1/2 的真实语料实测是一次性手工操作 | 误报治理不可持续 | P1 | 已加 `corpus-smoke.yml`：每周对 anthropics/skills、obra/superpowers、wshobson/agents 做非门禁扫描，输出 skills/findings/耗时摘要并上传 JSON 工件，异常 exit≥2 才失败 |
| 3 | osv-scanner 用公共漏洞库匹配具体已知威胁 | advisories/ 有 19 条已核实条目，但与 `scan` 无联动 | 已知恶意 skill 无法被点名识别 | P2 | 评估结论：需要先为每条 advisory 收集恶意内容哈希（多数源仓库已下架，哈希不可复现），当前证据不足以做可靠匹配；保持 advisory DB 为人工情报库，待可核实样本积累后再做哈希联动 |
| 4 | 单二进制分发（Go 系工具） | 需要 Node 22+ | 安装门槛 | P2 | npx 路径已足够顺滑（干净环境实测 <1 分钟）；SEA/pkg 打包投入产出比低，不做 |

## 回归结论

- 本轮为工程基建轮，无扫描行为变化；`pnpm build/lint/typecheck/test` 全绿。
- 平台矩阵首跑即抓到 2 个真实 Windows bug（pnpm filter 单引号在 cmd/pwsh 下不匹配任何项目导致 build/test 静默跳过；SARIF/JSON 快照未归一化 Windows 路径变体），修复后 ubuntu/windows/macos × Node 22/24 全绿 —— 印证「兼容性必须测出来」的判断。
- 诚实回答：兼容性此前是我们对照 osv-scanner/gitleaks 最大的"无证据声明"，本轮补上 CI 证据；分发形态（单二进制）仍不如 Go 系工具，但对 npm 生态目标用户不构成实际摩擦。

## ROUND-4 计划

1. 观察 corpus-smoke 首次运行结果，处理任何平台矩阵暴露的 Windows 路径问题。
2. OpenSSF Best Practices 自评（MATURITY 唯一未勾选项，需账号时向总负责人申请）。
3. 竞品动态跟踪：skillgate.sh 版本迭代复测 + socket.dev 的 skill 领域动向。
