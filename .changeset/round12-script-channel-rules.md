---
'skillwarden-core': minor
'skillwarden': minor
---

Close the script-channel detection gaps found against SkillTrustBench (5520
cases): `prompt-injection` now scans bundled scripts (docstrings/comments are
an instruction channel), `exfiltration` adds credential-file reads through
language runtimes, secret-keyword env harvesting loops, and bare public-IP
endpoint constants, `dangerous-commands` adds runtime shell-profile appends
and interpreter hook variables (PYTHONSTARTUP/LD_PRELOAD/NODE_OPTIONS/…), and
`dangerous-scripts` adds exec/eval of reversed or re-joined strings.
SkillTrustBench malicious misses drop 571→415 with +5 clean FPs; the four
real-world corpora are unchanged except one defensible new signal.
