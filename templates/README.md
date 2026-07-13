# Templates pack

Ready-to-copy charter templates for common workstream archetypes. Each one
is generic: copy it into your project's `charters/` directory, replace the
placeholders, delete what doesn't apply, and run `charter sync`.

```sh
cp templates/engineering.md path/to/your-project/charters/engineering.md
$EDITOR path/to/your-project/charters/engineering.md
cd path/to/your-project && charter sync
```

| Template | Owns |
| --- | --- |
| [`engineering.md`](engineering.md) | Code, architecture, tests, releases |
| [`docs.md`](docs.md) | Documentation and examples |
| [`research.md`](research.md) | User feedback and prioritization |
| [`gtm.md`](gtm.md) | Positioning, launches, announcements |

Two rules of thumb when filling one in:

1. **A fixed constraint is a decision you already made**, stated so an agent
   can't argue with it. "Use SQLite" is weaker than "All persistent data
   lives in a single SQLite file; do not introduce another datastore."
2. **If you're not sure it's settled, it's an open question.** The decision
   log exists for exactly this: `charter log` it now, `charter promote` it
   when it stops being debated.

For a filled-in setup showing all four archetypes together, see
[`examples/acme-tasks/`](../examples/acme-tasks/).
