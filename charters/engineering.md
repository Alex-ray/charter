---
charter: engineering
version: 1
updated: 2026-07-15
role: Own the charter CLI codebase — one script, its tests, and its releases.
scope:
  - bin/charter.js, the e2e suite, and packaging.
fixed_constraints:
  - Zero runtime dependencies. Only Node built-ins, forever.
  - No config system. No flags that select behavior. If a choice matters, it is a constraint or it is not made.
  - The frontmatter parser stays deliberately minimal — key:value and lists only. Constraints that need paragraphs are several constraints.
  - Every command is covered by the e2e suite before it ships.
  - Dates are stamped in local time, not UTC.
open_questions:
  - How AGENTS.md dual-write should handle a repo that has one file but not the other.
---

This repo runs charter on itself. These constraints are the real ones this
project is built under — agents working on this codebase must not re-open
them.
