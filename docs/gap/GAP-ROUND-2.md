# GAP-ROUND-2 — 生产级对标循环 · 第 2 轮

日期：2026-08-04 · 参照物：gitleaks 8.24.3（本地真实安装运行）、semgrep（suppression 设计反推）、ROUND-1 干净环境回归中新用户视角发现的 UX 缺口。

## 参照物实测记录

### gitleaks 8.24.3（真实运行）

- `gitleaks dir .` 对随机 AWS key 报 1 leak；同一 key 加 `# gitleaks:allow` 行内注释后 0 leak（实测两次运行对照）。
- AWS 官方文档示例 key `AKIAIOSFODNN7EXAMPLE` 内置 allowlist 不报 —— 与我们 ROUND-1 的占位值 allowlist 思路一致，互相印证。
- 输出为单行 INF/WRN 日志 + 逐 finding 明细；`--help` 顶部即给出可执行的子命令面板。

## 差距清单与处置

| # | 参照物做到 | 我们的现状（实测） | 差距 | 级别 | 处置 |
|---|---|---|---|---|---|
| 1 | gitleaks finding 输出直接可操作（Fingerprint 字段可复制进 .gitleaksignore） | fingerprint 只在 `--format json` 出现，表格用户要自己拼 | 豁免流程断裂 | **P0** | 已修：表格每条 finding 追加 `ignore: <fingerprint>` 行，复制即用 |
| 2 | gitleaks/semgrep `--help` 自带上手示例 | `skillwarden --help` 只有子命令列表 | 新用户 5 分钟上手目标 | P1 | 已修：`--help` 追加 Quick start 三行 + 豁免说明 + 文档链接 |
| 3 | gitleaks 有 `# gitleaks:allow` 行内豁免 | 无行内豁免 | — | **有意不做** | 威胁模型不同：skill 内容本身是不可信输入，行内注释=恶意作者自我豁免通道。已写入 FAQ 说明（诚实边界） |
| 4 | semgrep `--baseline-commit` 存量治理 | 无 baseline | 大存量仓库落地摩擦 | P2 | `.skillwardenignore` 通配已可覆盖大部分场景；真实需求出现前不加（避免大而空） |
| 5 | socket.dev / skillgate `install` 安装时守门 | 只有事后 scan/ci | 安装时拦截缺失 | P2 | 保持 ROADMAP 评估项（`skillwarden add <source>`），需要先定义跨生态"安装"语义 |

## 回归结论（新用户身份）

- `--help` 一屏内可完成第一次成功使用；表格输出的 `ignore:` 指纹在 claude-code 语料上实测复制进 `.skillwardenignore` 后 `ci` 通过。
- 诚实回答：豁免闭环（发现→复制指纹→豁免→过闸）现已与 gitleaks 同级；行内豁免为有意的安全取舍并已公开文档化。剩余弱项为 baseline 模式与安装时守门，均为 P2，待真实用户需求触发。

## ROUND-3 计划

1. Windows 路径兼容验证 + Node 22/24 CI 矩阵（生产级基线第 6 条）。
2. 公开语料持续回归：把 anthropics/skills、wshobson/agents 扫描作为每周 CI 冒烟（只观测不门禁），追踪误报回归。
3. 评估 advisory DB 与 scan 的联动（已知恶意 skill 哈希比对）。
