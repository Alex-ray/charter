---
charter: engineering
version: 1
role: Own the <project> codebase — architecture, code quality, tests, and releases.
scope:
  - Application source, test suite, and build tooling.
  - CI configuration and release process.
fixed_constraints:
  - <your primary datastore decision, stated as a rule agents cannot argue with>
  - <your dependency policy, e.g. "new runtime dependencies require a logged decision first">
  - <your testing bar, e.g. "every user-visible change ships with a test">
  - <a boundary you keep re-explaining, e.g. "the public API is X; everything else is internal">
open_questions:
  - <something genuinely undecided that agents may discuss>
---

Replace every `<placeholder>` above, then delete this note. Good engineering
constraints are the decisions agents keep trying to "improve": the datastore,
the package layout, the dependency policy, the testing bar. If a constraint
needs a paragraph, split it into several one-line constraints.
