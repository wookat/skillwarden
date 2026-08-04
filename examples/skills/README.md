# Example skills

Fixtures used by the README quick start and by CI dogfooding.

- `benign-skill/` — a realistic, clean skill. `skillgate scan examples/skills/benign-skill` exits 0.
- `malicious-skill/` — a deliberately malicious skill combining instruction override,
  concealment, pipe-to-shell, secret exfiltration to a dead-drop endpoint, and an
  obfuscated payload in a bundled script. `skillgate scan examples/skills/malicious-skill` exits 1.

The malicious example is inert: the endpoints are not real dead drops and nothing here
is executed by the scanner — SkillGate only reads files.
