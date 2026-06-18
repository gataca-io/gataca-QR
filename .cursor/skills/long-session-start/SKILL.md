---
name: long-session-start
description: Use when the user explicitly starts or resumes a long multi-session task.
---

# Long Session Start

Use this skill only when the user explicitly asks to start or resume a long session.

Accepted triggers:

- `/longsession`
- `longsession`
- `start long session`
- `resume long session`
- `continue harness`

Read only the minimum useful harness files:

1. `.ai-harness/progress.md`
2. `.ai-harness/handoff.md`
3. `.ai-harness/feature-list.md`
4. `.ai-harness/verification.md`
5. `.ai-harness/commands.md` only if commands are needed

Do not read `.ai-harness/**` for normal tasks.

Process:

1. Summarize current state.
2. Identify completed work.
3. Identify open work.
4. Pick the next smallest useful task.
5. Ask one precise question if blocked.
6. Do not code until the state is clear.

Output:

- Current state.
- Next smallest task.
- Files likely needed.
- Verification likely needed.
