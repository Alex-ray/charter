# Charter schema

A charter is a markdown file in this directory: `charters/<name>.md`.
It records what one agent, role, or workstream owns — and which decisions
are settled so agents stop re-litigating them.

Every charter starts with a YAML frontmatter block:

```markdown
---
charter: engineering
version: 1
updated: 2026-01-01
role: Own code quality and architecture for the project.
scope:
  - Application code, tests, and CI.
fixed_constraints:
  - Settled decision agents must not re-open.
open_questions:
  - Genuinely undecided question agents may discuss.
---

Optional free-form notes. Only the frontmatter is injected into agent
context by `charter sync`.
```

## Fields

| Field | Type | Meaning |
| --- | --- | --- |
| `charter` | string | Name of the charter. Defaults to the filename. |
| `version` | integer | Bumped automatically by `charter promote`. |
| `updated` | date | Set automatically by `charter promote`. |
| `role` | string | One sentence: what this charter owns. |
| `scope` | list | What the charter covers. |
| `fixed_constraints` | list | Settled decisions. Agents must not re-litigate these. |
| `open_questions` | list | Explicitly undecided. Agents may discuss these. |

## Frontmatter rules (strict YAML subset)

The parser is deliberately minimal. Only two shapes are allowed:

- `key: value` — single-line string values
- `key:` followed by `  - item` lines — lists of single-line strings

No nesting, no multi-line strings, no quoting rules. If a constraint needs
a paragraph, it is probably several constraints.

## Lifecycle

1. Copy `TEMPLATE.md` to `<name>.md` and fill it in.
2. Run `charter sync` to inject charters into `CLAUDE.md`.
3. Record decisions as they happen: `charter log "..." --charter <name>`.
4. When a decision is settled, `charter promote <id>` moves it into
   `fixed_constraints`, bumps `version`, and re-syncs.
