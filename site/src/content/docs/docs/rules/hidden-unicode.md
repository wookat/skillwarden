---
title: hidden-unicode
description: Zero-width, bidi-control, Unicode tag, and other invisible characters that smuggle instructions past human review.
---

Invisible Unicode is fully visible to the model but not to a human reviewer — the
canonical "invisible prompt injection" vector. This rule flags every occurrence,
grouped by character class per file.

## What it checks

- **Zero-width characters** — U+200B/U+200C/U+200D, U+FEFF, U+2060 (`high`).
- **Bidirectional control characters** — U+202A–U+202E, U+2066–U+2069, U+061C, which
  can visually reorder text ("Trojan Source").
- **Unicode tag characters** — U+E0000–U+E007F, the tag block used to encode entire
  hidden instruction strings.
- **Invisible formatting characters** — soft hyphen, combining grapheme joiner,
  variation selectors, U+180E.
- **Private-use-area characters** — U+E000–U+F8FF and the supplementary PUA planes.

## Example finding

```json
{
  "ruleId": "hidden-unicode",
  "severity": "high",
  "message": "1 zero-width character found — invisible to human review",
  "file": "SKILL.md",
  "line": 6
}
```

## Fixing findings

- Strip the characters (e.g. re-save the file from a plain-text editor, or filter
  with a normalizer) and re-review the visible text.
- If the skill legitimately documents Unicode edge cases, isolate the samples in a
  dedicated data file and treat any finding there as a deliberate, reviewed exception.
