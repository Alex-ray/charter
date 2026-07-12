---
charter: engineering
version: 2
role: Own the Acme Tasks codebase — architecture, code quality, tests, and releases.
scope:
  - Application source, test suite, build tooling, and CI configuration.
  - Release packaging for self-hosted installs.
fixed_constraints:
  - Acme Tasks is self-hosted only; never add code that phones home or collects telemetry.
  - All persistent data lives in a single SQLite file so backup is one file copy.
  - The core has zero runtime dependencies; new dependencies require a logged decision first.
  - Every user-visible change ships with a test and a changelog entry.
  - Task import supports CSV only; other formats go through CSV converters
open_questions:
  - What a plugin API should look like, if we add one at all.
  - Whether the web UI should support offline mode.
updated: 2026-07-12
---

Acme Tasks is a fictional example product. This charter shows the
engineering archetype: constraints about architecture and process that
agents working on code should treat as settled.
