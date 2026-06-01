---
name: session-start
description: >
  Run at the start of every new Claude Code session on the SpinPad project.
  Greets the user, reads the GitHub Project V2 kanban board, and routes to
  either (A) a free-prompt flow with mandatory /grill-me alignment, or
  (B) a task-pick flow from the current board state.
  Use when the user opens a session, says "let's work", "start", "what should
  we do", or gives no explicit task yet.
---

# session-start

## Purpose

Orient every session in under 60 seconds. Read the live board, surface what
matters, then let the user choose their mode. Never assume what they want to
work on.

---

## Step 1 — Read the board silently

Using the `gh` CLI (Projects v2 — see `docs/agents/issue-tracker.md`, the
issue-tracker convention for this repo):

1. Find the SpinPad project: `gh project list --owner AristideBH`.
2. Fetch all items: `gh project item-list <number> --owner AristideBH --format json`.
   Each item carries its `status` field and linked issue `number` + `title`.
3. Keep only columns **Backlog + Ready**, **In Progress**, and **In Review**
   for display — Done is noise at session start.

Do this silently. Do not narrate commands.

Reading a Projects v2 board needs the `read:project` token scope. If `gh`
returns a missing-scope error, skip the snapshot gracefully (per the guardrail
below) and tell the user once: _"board unreadable — run
`gh auth refresh -s read:project,project` to enable it."_

---

## Step 2 — Present the board snapshot

Display a compact, readable summary. Format:

```
📋 SpinPad — board snapshot

🔵 In Progress  (N)
  #42  Short title of issue
  #38  Short title of issue

🟡 In Review    (N)
  #35  Short title of issue

⬜ Ready / Backlog  (N)
  #31  Short title of issue
  #29  Short title of issue
  … (show max 5, mention count if more)
```

If all three columns are empty, say so in one line and skip to Step 3.

Rules:

- One line per issue: `#number  title` — no body, no labels, no dates
- Max 5 items per column in the snapshot
- No markdown tables, no bold per item — keep it scannable

---

## Step 3 — Offer two modes

After the snapshot, ask exactly this (adapt if board is empty):

```
Two ways to go:

  [A] Tell me what you want to build or fix → I'll grill you before we touch any code
  [B] Pick a task from the board above → I'll load it and we'll plan together

Which one? (A/B or just describe what's on your mind)
```

Wait for the user's response. Do not proceed until they answer.

---

## Step 4A — Free prompt flow

If the user picks A or describes something new:

1. Acknowledge in one caveman line (no filler).
2. **Immediately invoke `/grill-me`** — do not skip this, do not ask for
   permission. This is mandatory before any code, file edit, or plan is
   produced.
3. After /grill-me completes and both parties have alignment, offer to run
   `/to-issues` to break the work into GitHub issues before starting.

---

## Step 4B — Task-pick flow

If the user picks B or names/numbers a specific issue:

1. Fetch the full issue body and comments: `gh issue view <N> --comments`.
2. Present a brief triage summary:
   - What the issue asks for
   - Relevant files or areas of the codebase (use your own reading, not just
     the issue body)
   - Your recommended approach in 2–3 sentences
3. Ask: _"Does this match what you want to tackle? Any constraints I should
   know before we start?"_
4. Wait for confirmation.
5. Once confirmed, move the issue to **In Progress** on the kanban with
   `gh project item-edit` (same flow as finish-task Step 6) — but **only after
   explicitly telling the user** you're about to do it:
   `"Moving #N to In Progress — ok?"` and waiting for a yes.
6. Then proceed with `/grill-me` if the issue is underspecified, or go
   straight to implementation planning if it's already detailed.

---

## Guardrails

- **Never write code, edit files, or create branches during this skill.**
  session-start is orientation only.
- **Never move kanban items without explicit user confirmation.**
- **Never skip /grill-me** for new work. If the user asks to skip it, note
  it once and comply — but note it.
- If `gh` is unavailable, unauthenticated, or returns an error (e.g. missing
  `read:project` scope), skip the board snapshot gracefully and go straight to
  Step 3.
- Always use caveman mode throughout (no filler, no pleasantries beyond the
  opening line).
