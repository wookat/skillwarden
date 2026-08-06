---
'skillwarden': patch
'skillwarden-core': patch
---

CLI robustness: usage errors now exit 2 as documented (unknown commands/flags previously exited 1, colliding with the gate-failure code); a corrupt `skillwarden.lock` reports "not valid JSON — re-run `skillwarden lock`" instead of a raw JSON parse error; scanning a nonexistent path reports "Path does not exist: …" instead of a raw ENOENT.
