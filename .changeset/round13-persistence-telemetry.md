---
'skillwarden-core': minor
'skillwarden': minor
---

Cover the persistence, telemetry and config-poisoning clusters that
SkillTrustBench still slipped past: skills bundling agent hook/config files
(`.claude/hooks/`, `settings.json`, `mcp.json`) are flagged, `exfiltration`
adds host/workspace fingerprint telemetry, disposable free-tier collector
endpoints and secret-filtered env encoding, `dangerous-commands` adds
`site-packages` `.pth` persistence, argv-form crontab, detached
(`nohup`/`setsid`) processes and runtime chmod widening, and
`dangerous-scripts` adds exec/eval over lists of code strings. RFC 5737
documentation IP ranges no longer trigger the bare-IP endpoint pattern.
SkillTrustBench malicious misses 415→228; real-world corpora unchanged.
