# GAP-ROUND-7 — 生产级对标循环 · 第 7 轮

日期：2026-08-04 · 主题：接总负责人决策落地 + ClawHub malicious 漏报补规则（train split 开发 / eval_holdout 验收）。

## 决策落地

- exfiltration 规则**维持 critical 不降级**（总负责人决策：宁误报不漏报，场景化降级会留「伪装官方 API」通道）。
- 改善走豁免 UX：FAQ 新增「API skill 自家 token→官方 API 被标记怎么办」条目，说明 review→ignore 指纹→锁文件仍防 rug-pull 的完整流程。

## 漏报分析（ROUND-6 遗留 6 例 malicious 漏报）

逐例复核 eval_holdout 中 8 例 LLM-labeled malicious：

| 案例 | 攻击特征 | 处置 |
|---|---|---|
| douyin-report-search | 「automatic CAPTCHA solving (slide-puzzle)」+ QR 登录自动化 | **新规则命中** |
| human-browser-use | anti-bot evasion、hide automation fingerprints、navigator.webdriver 隐藏 | **新规则命中** |
| SkillPay.me ×2（Context Distiller / Safety Checker） | 加密货币按次付费导流（USDT per call → skillpay.me） | 未加规则：train split 上 crypto-per-call 短语 41 例被 LLM 判 clean（x402 类合法 agent 支付已成真实模式），词面规则会误伤；skillpay.me 域名情报待可核实来源后入 advisory DB |
| Cross-Validate CI-Level 2 | 伪「事实核查置信度提升」语义骗局 | 纯语义，无词面 payload，确定性规则有意不覆盖（定位边界） |
| f5-telegram-notify | 硬编码绝对路径的 Telegram 通知脚本，恶意性依赖上下文 | 同上 |

## 新规则：`detection-evasion`（severity high）

- 三类模式：CAPTCHA solving/bypass（reCAPTCHA/hCaptcha/GeeTest/Turnstile/slide-puzzle）、anti-bot 检测规避（Cloudflare/DataDome/PerimeterX/Kasada/Akamai）、自动化指纹隐藏（navigator.webdriver spoofing）。带否定语义 guard（"never bypasses CAPTCHAs" 不报）。
- **开发/验收分离**：模式在 train split（47k 例）上调参（CAPTCHA 类命中 clean 25 / susp 49 / mal 17，≥73% 非 clean），eval_holdout 只做验收避免过拟合。
- 验收数字：eval_holdout malicious 漏报 6→4（douyin、human-browser-use 转 suspicious 命中）；**四个真实语料仓库（anthropics/skills、superpowers、agents、claude-code）0 新增 findings**；binary accuracy 0.633→0.635。
- 文档：规则参考新页 + README/站点/THREAT-MODEL 更新为七类规则。

## 回归结论

- 本轮为规则面扩展，核心行为回归全绿（build/lint/typecheck/test + SARIF 快照有意更新）。
- 诚实回答：剩余 4 例漏报均为语义级骗局，属确定性 gate 的定位边界而非规则缺陷；skillpay.me 域名情报是 advisory DB 的正确归宿（待可核实公开来源）。

## ROUND-8 计划

1. ClawScan adapter PR（生态位 P0，外部上游仓库，按其 docs/scanners.md 流程）。
2. corpus-smoke 周一 cron 首跑观察。
3. skillpay.me 家族公开来源核实后入 advisory DB。
