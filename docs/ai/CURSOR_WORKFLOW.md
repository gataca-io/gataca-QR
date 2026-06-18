# Cursor workflow

Human reference only — do not auto-load unless asked.

**Output mode:** first line `outmid` (default). Skill: `.cursor/skills/outmid/SKILL.md`.

**Long sessions:** say `longsession` to activate `.ai-harness/` (progress, handoff, feature-list, verification, commands). Skills: `long-session-start`, `long-session-end` in `.cursor/skills/`.

**Handoff to new chat:** `session-summary` skill.

**Safe task template:**
```
outmid
Task: [change]
Scope: only [files]
Process: plan → implement → run VERIFICATION.md checks → summarize
Stop if confidence <95%.
```
