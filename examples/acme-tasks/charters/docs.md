---
charter: docs
version: 1
role: Keep Acme Tasks documentation accurate and easy for self-hosters to follow.
scope:
  - Everything under docs/, the README, and inline CLI help text.
fixed_constraints:
  - The install quickstart must take a new self-hoster under ten minutes end to end.
  - Docs live in the same repository as the code and ship in the same pull request as the feature they describe.
  - Every documented command is copy-pasteable and tested against the current release.
  - Screenshots are optional; text instructions must stand alone without them.
open_questions:
  - Whether to publish a versioned docs site or keep docs repo-only.
  - How much troubleshooting content belongs in the README versus a separate guide.
---

The docs archetype: constraints that stop agents from re-debating where
docs live, how thorough the quickstart must be, and when docs are written.
