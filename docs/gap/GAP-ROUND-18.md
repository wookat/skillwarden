# GAP-ROUND-18 — 真实用户体验走查：CLI 坏输入/错误路径审计（2026-08-06）

方法：以新用户身份用**已发布的 npm 产物**（`npx skillwarden@0.7.1`）走一遍所有失败路径（空项目、缺 lockfile、坏 lockfile、非法 flag、未知命令、不存在的路径、无权限输出），对照 gitleaks/osv-scanner 的错误处理水准与我们自己的 `docs/spec/cli-contract.md`。

## 1. 发现的差距

| # | 场景 | 0.7.1 实际行为 | 差距 | 级别 | 处置 |
| --- | --- | --- | --- | --- | --- |
| 1 | `skillwarden frobnicate` / `scan --frobnicate` | exit **1** | 与 cli-contract 冲突：1 = gate failure，CI 里未知 flag 会被误读为"发现威胁"；契约规定 usage error = 2 | **P0** | Commander `exitOverride`（含全部子命令），usage error → 2，`--help`/`--version` → 0 |
| 2 | `skillwarden.lock` 损坏 → `ci`/`diff` | 裸 JSON.parse 报错 `Unexpected token 'o', "not json" is not valid JSON`，exit 2 | 报错无指引，不知道该做什么 | P1 | `readLockfile` 包装解析错误："Lockfile at … is not valid JSON — re-run `skillwarden lock` to regenerate it" |
| 3 | `scan /不存在的路径` | 裸 `ENOENT: no such file or directory, stat '…'` | 系统级报错泄露实现细节、可读性差 | P1 | `loadSkillsFromPath` 先检查存在性："Path does not exist: …" |
| 4 | 空项目 scan / ci 无 skills / diff 无 lock / 非法 `--fail-on` / 输出无权限 | 均为清晰单行报错 + exit 2 | 无 | — | 达标（对齐 gitleaks 水准），无需改动 |

## 2. 修复与验证

- `packages/cli/src/index.ts`：`program.exitOverride()` + 所有子命令 `exitOverride()`，`parseAsync` 统一 catch——CommanderError 且 exitCode 0（help/version）→ 0，否则 → 2；非 Commander 错误打印 message → 2。
- `packages/core/src/lockfile.ts`：`readLockfile` 区分"读不到文件"（沿用上层处理）与"内容非 JSON"（新可操作报错）。
- `packages/core/src/discovery.ts`：`loadSkillsFromPath` 不存在路径抛出明确错误。
- 新增 2 个 core 测试（坏 JSON lockfile 提示、Nonexistent path 提示）；本地 `build/lint/typecheck/test` 全绿（core 123 / cli 12）。
- 本地 dist 复验：unknown command/flag → 2；`--help`/`--version`（含子命令 help）→ 0；corrupt lock `ci` → 新报错 + 2；install-policy 行为不变。

## 3. 数据回归（规则无改动，验证无漂移）

真实语料 findings 与 ROUND-16/17 完全一致：anthropics-skills 6 / superpowers 0 / agents 14 / claude-code 5。SkillTrustBench 指标不受本轮影响（未触规则），维持 ROUND-13 基线（binary 0.8168，malicious→clean 228）。

## 4. 竞品/外部复测

- skillgate.sh：npm 仍 0.2.1（第 8 轮停更）。
- ClawScan upstream：HEAD 仍 `b4d4470`，adapter 分支无需 rebase。
- corpus-smoke：仍 0 runs，首个 cron 2026-08-10（周一）06:17 UTC。

## 5. 结论

失败路径体验此前是"半达标"：正常错误报文清晰，但退出码契约在 Commander 默认行为下被破坏（P0，影响 CI 语义），且两类系统级裸报错不符合"生产级健壮性：不输出堆栈垃圾、报错有指引"的验收基线。本轮修复后所有失败路径符合 cli-contract 与 gitleaks 级别的错误处理水准。
