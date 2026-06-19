---
name: session-summary
description: Use to create a compact handoff before clearing context or starting a new chat.
---

# Session Summary

Create a compact handoff for a new chat.

Include:

1. Goal.
2. Current state.
3. Decisions made.
4. Files changed.
5. Verification run.
6. Known issues.
7. Next smallest task.
8. Exact continuation prompt.

Rules:

- Do not include full diffs.
- Do not include unrelated conversation.
- Do not dump file contents.
- Keep the summary concise.
- Preserve enough context to resume safely.
