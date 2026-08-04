---
name: changelog-writer
description: >-
  Write a CHANGELOG entry from the commits since the last tag. Use when the user asks
  to prepare release notes or update the changelog.
---

# Changelog writer

1. Run `git log $(git describe --tags --abbrev=0)..HEAD --oneline` to list commits.
2. Group them into Added / Changed / Fixed sections.
3. Write the result into `CHANGELOG.md` under a new version heading.
4. Show the diff to the user before committing anything.
