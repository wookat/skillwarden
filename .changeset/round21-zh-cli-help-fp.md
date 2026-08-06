---
'skillwarden-core': patch
'skillwarden': patch
---

prompt-injection: bare Chinese 跳过确认/跳过检查 (e.g. "--force 跳过确认" in CLI help text) now reports at medium instead of critical; explicit bypass phrasing (绕过/规避 + 安全/权限/检查…, or 跳过/关闭/禁用 + quantifier or strong object) stays critical. Fixes a real-world false positive on legitimate Chinese CLI documentation while keeping bypass instructions gate-blocking.
