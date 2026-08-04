# SkillWarden 成熟度清单（对齐 AgentGate docs/MATURITY.md 标准）

基准：OpenSSF Best Practices Badge、npm 生态发布工程惯例、AgentGate Wave 2 清单。目标：达到「用户敢在生产 CI 里跑」的可信度。验收以本清单逐项对照，每项完成在 PR 描述中引用条目。

## A · 工程与发布
- [x] 发布工程：changesets（semver + CHANGELOG 自动化）、GitHub Actions 发布流水线、npm provenance（OIDC / token fallback）
- [x] GitHub Release（v0.2.0 已发）；产物签名/provenance：npm 发布已完成，trusted publishing 待配
- [x] 测试深化：核心覆盖率门禁（stmts/lines ≥90%、funcs ≥85%、branches ≥75%）在 CI 强制；快照测试锁定 `--json` / SARIF 输出契约；CI e2e：pack → npm install → scan/lock/diff/ci 全链路含漂移失败路径
- [x] 健壮性：exit code 契约（0/1/2）冻结于 docs/spec/cli-contract.md
- [x] 供应链自卫：CI actions pin 到 SHA、依赖 `--frozen-lockfile`、SECURITY.md、dogfood（CI 用 skillwarden 扫 examples）
- [x] lockfile 规范 v1 冻结：docs/spec/lockfile-v1.md（版本字段 + 迁移策略）

## B · 平台与文档
- [x] 文档站：https://skillwarden.zalize.com（Astro/Starlight + Cloudflare Pages，20 页，含 Pagefind 搜索）
- [x] 规则参考逐条文档（六类规则各一页含真实样例）、威胁模型（docs/THREAT-MODEL.md，映射六类规则 + 残余风险 R1-R10）；⬜ CI 集成配方专页、FAQ
- [x] Advisory DB 产品化：10 条已核实条目（SKA-2026-0001..0010，均有公开参考链接）、schema 校验 CI、网站可浏览；⬜ 持续扩充
- [ ] SEO/OG 卡片、Lighthouse ≥90

## C · 社区治理与增长
- [x] 治理文件：CONTRIBUTING.md、CODE_OF_CONDUCT.md、GOVERNANCE.md、SUPPORT.md、SECURITY.md、ROADMAP.md
- [x] issue/PR 模板（bug_report、detection_gap、PULL_REQUEST_TEMPLATE）
- [ ] OpenSSF Best Practices Badge 自评提交
- [x] 自动化：Dependabot
- [x] 演示资产：README 终端演示动画（docs/assets/demo.svg：scan → lock → 篡改 → ci 拦截）
- [x] npm 正式发布：skillwarden@0.2.0 / skillwarden-core@0.2.0（npx 验证可用）；⬜ Show HN/awesome-agent-skills 收录（等总负责人指令，内容包草稿见 docs/launch/announcement-draft.md）

## 公共
- 一切走 PR + CI 绿后合并；跨模块接口以 docs/spec/ 为准。
