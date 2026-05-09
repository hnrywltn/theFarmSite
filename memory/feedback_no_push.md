---
name: Never push to git
description: User explicitly does not want Claude to ever run git push
type: feedback
---

Never run `git push` under any circumstances, including deployment fixes, urgent bugs, or when it seems convenient. Always commit and stop — the user pushes manually.

**Why:** User stated this explicitly and repeated it after a violation.

**How to apply:** After every commit, stop. Do not add `&& git push` or run a separate push command, even when fixing a live production issue.
