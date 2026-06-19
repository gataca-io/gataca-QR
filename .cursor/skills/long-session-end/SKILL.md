---
name: long-session-end
description: Use when closing a long session and preparing a future handoff.
---

# Long Session End

Use this skill when the user asks to close, end, or hand off a long session.

Update only:

- `.ai-harness/progress.md`
- `.ai-harness/handoff.md`
- `.ai-harness/verification.md` if commands changed
- `.ai-harness/commands.md` only if command guidance changed

Do not update application code.

Include:

1. What changed.
2. Files touched.
3. Verification run.
4. Current state.
5. Known issues.
6. Next recommended task.
7. Continuation prompt.

Rules:

- Do not include full diffs.
- Do not paste long logs.
- Keep handoff concise.
- Preserve enough context to resume safely.
- Mention blockers clearly.
