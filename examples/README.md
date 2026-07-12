# Examples

`acme-tasks/` is a complete charter setup for a fictional product: **Acme
Tasks**, an imaginary open-source, self-hosted task tracker. Nothing here
describes a real product or team — the point is to show the archetypes.

It contains four charters covering common workstream archetypes:

- [`engineering.md`](acme-tasks/charters/engineering.md) — owns the codebase
- [`docs.md`](acme-tasks/charters/docs.md) — owns documentation
- [`research.md`](acme-tasks/charters/research.md) — owns user feedback and prioritization
- [`gtm.md`](acme-tasks/charters/gtm.md) — owns adoption and announcements

The `CLAUDE.md` and `charters/decisions.md` in that directory were generated
by running the CLI (`charter sync`, `charter log`, `charter promote`), so the
example also shows what the injected block and a partially-promoted decision
log look like in practice.

To adapt an archetype for your own project, copy the file into your
`charters/` directory, rewrite the frontmatter, and run `charter sync`.
