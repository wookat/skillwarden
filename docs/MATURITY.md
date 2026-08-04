# SkillWarden 成熟度清单（对齐 AgentGate docs/MATURITY.md 标准）

基准：OpenSSF Best Practices Badge、npm 生态发布工程惯例、AgentGate Wave 2 清单。目标：达到「用户敢在生产 CI 里跑」的可信度。验收以本清单逐项对照，每项完成在 PR 描述中引用条目。

## A · 工程与发布
- [x] 发布工程：changesets（semver + CHANGELOG 自动化）、GitHub Actions 发布流水线、npm provenance（OIDC / token fallback）
- [ ] GitHub Release + 产物签名
- [ ] 测试深化：核心覆盖率 ≥80% 并在 CI 强制；快照测试锁定 `--json` / SARIF 输出契约
- [x] 健壮性：exit code 契约（0/1/2）冻结于 docs/spec/cli-contract.md
- [x] 供应链自卫：CI actions pin 到 SHA、依赖 `--frozen-lockfile`、SECURITY.md、dogfood（CI 用 skillwarden 扫 examples）
- [x] lockfile 规范 v1 冻结：docs/spec/lockfile-v1.md（版本字段 + 迁移策略）

## B · 平台与文档
- [ ] 文档站（Astro/Starlight + Cloudflare Pages，先 pages.dev，后 skillwarden.zalize.com）
- [ ] 规则参考逐条文档、威胁模型（docs/THREAT-MODEL.md）、CI 集成配方、FAQ
- [ ] Advisory DB 产品化：已核实条目收录、社区提交流程（PR 模板 + 校验 CI 已就绪）、网站可浏览
- [ ] SEO/OG 卡片、Lighthouse ≥90

## C · 社区治理与增长
- [x] 治理文件：CONTRIBUTING.md、CODE_OF_CONDUCT.md、GOVERNANCE.md、SUPPORT.md、SECURITY.md、ROADMAP.md
- [ ] issue/PR 模板
- [ ] OpenSSF Best Practices Badge 自评提交
- [x] 自动化：Dependabot
- [ ] 演示资产：终端演示 GIF、README hero 图
- [ ] 发布执行：npm 正式发布（等 token scope 确认）、Show HN/awesome-agent-skills 收录（等总负责人指令）

## 公共
- 一切走 PR + CI 绿后合并；跨模块接口以 docs/spec/ 为准。
