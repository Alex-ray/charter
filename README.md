# charter

Encode settled decisions as fixed constraints so coding agents don't
re-litigate them.

If you run multi-agent coding setups, you've seen agents cheerfully re-open
questions you settled weeks ago — swapping the database, re-debating the
package layout, "improving" positioning you already locked. `charter` gives
each workstream a small, versioned charter file that says what it owns, which
decisions are fixed, and which questions are genuinely open — and injects
those constraints into [Claude Code](https://claude.com/claude-code)'s
context via `CLAUDE.md`.

- **Zero dependencies.** One Node script. `npx`-able, vendorable, auditable.
- **Plain markdown.** Charters are versioned markdown files with a strict
  YAML-frontmatter subset. They live in your repo and diff like code.
- **A promotion path.** Decisions start in a log; when they're settled, one
  command moves them into a charter's fixed constraints and bumps its version.

## Quickstart

Requires Node 18+.

```sh
git clone https://github.com/Alex-ray/charter
npm install -g ./charter   # installs the `charter` command
```

Then, in your project root:

```sh
charter init
```

This scaffolds:

```
charters/
  SCHEMA.md      # the charter format, documented
  TEMPLATE.md    # copy this to create a charter
  decisions.md   # the decision log
CLAUDE.md        # gains a managed block between charter markers
```

Create your first charter and re-sync:

```sh
cp charters/TEMPLATE.md charters/engineering.md
$EDITOR charters/engineering.md   # set the name, role, scope, constraints
charter sync
```

`sync` rewrites the block between `<!-- charter:begin -->` and
`<!-- charter:end -->` in `CLAUDE.md`. Everything outside the markers is
yours; `charter` never touches it. From then on, every Claude Code session in
the project starts with your fixed constraints in context, framed as settled
decisions that must not be re-opened.

### Don't want to write frontmatter? Don't.

Charters are plain markdown in your repo and the format is documented in
`charters/SCHEMA.md`, so the agent can do the authoring for you. After
`charter init`, tell Claude Code:

> Read charters/SCHEMA.md, then create charters/engineering.md for this
> project — infer the role, scope, and open questions from the codebase, and
> propose fixed constraints for the decisions I've clearly already made.
> Then run `charter sync`.

Agents can also record decisions themselves as you make them mid-session
(`charter log`). The one thing to keep for yourself is `charter promote` —
deciding what's *settled* is the human's job, and that's the point of the
tool.

## Recording and promoting decisions

Decisions rarely arrive settled. Log them as they happen:

```sh
charter log "All persistence goes through a single storage module" --charter engineering
# logged    D-0001 → engineering: All persistence goes through ...
```

When a decision is settled, promote it:

```sh
charter promote D-0001
```

`promote` appends the decision to the charter's `fixed_constraints`, bumps
the charter's `version`, stamps `updated`, marks the log entry promoted, and
re-runs `sync` — so agents pick up the new constraint on their next session.

## The charter format

```markdown
---
charter: engineering
version: 1
role: Own the codebase — architecture, code quality, tests, and releases.
scope:
  - Application source, tests, and CI.
fixed_constraints:
  - All persistent data lives in a single SQLite file.
open_questions:
  - What a plugin API should look like, if we add one at all.
---

Optional free-form notes. Only the frontmatter is injected into context.
```

`fixed_constraints` are settled — the injected block tells agents to surface
conflicts rather than work around them. `open_questions` are explicitly
undecided, so agents know what's still safe to discuss. The full format,
including the deliberately strict frontmatter rules, is documented in
`charters/SCHEMA.md` after `init`.

## Examples and templates

[`examples/acme-tasks/`](examples/acme-tasks/) is a complete setup for a
fictional self-hosted task tracker, with four archetype charters —
engineering, docs, research, and gtm — plus a generated `CLAUDE.md` and a
decision log with one promoted entry. Copy an archetype and rewrite it for
your project.

[`templates/`](templates/) has blank versions of the same four archetypes:
copy one into your `charters/` directory, replace the placeholders, and run
`charter sync`.

## Commands

| Command | What it does |
| --- | --- |
| `charter init` | Scaffold `charters/` and inject the block into `CLAUDE.md` |
| `charter sync` | Re-render the `CLAUDE.md` block from `charters/*.md` |
| `charter log "<decision>" --charter <name>` | Append a decision to the log |
| `charter promote <id>` | Move a logged decision into `fixed_constraints` |

## Scope

Deliberately small: local files, one injection target (Claude Code via
`CLAUDE.md`), no config beyond the commands above. No hosted service, no
dashboard, no auth.

## License

MIT
