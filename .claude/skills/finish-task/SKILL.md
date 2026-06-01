---
name: finish-task
description: >
  Run when a task or issue is complete and ready to ship. Creates a branch,
  commits work, opens a Pull Request on AristideBH/spinPad, and moves the
  kanban card to Done — each step gated by explicit user confirmation.
  Use when the user says "we're done", "ship it", "open a PR", "mark as done",
  or "finish this task".
---

# finish-task

## Purpose

Close the loop on a completed task: branch → commit → PR → kanban update.
Every write action (git or GitHub) requires a confirmation from the user
before execution. No surprises.

---

## Step 1 — Confirm scope

Ask in one line:

```
finish-task: confirm we're closing #<N> "<issue title>"? (y / or tell me what
changed)
```

If no issue number is in context, ask which issue this work resolves.
Wait for confirmation before doing anything.

---

## Step 2 — Check working tree

Run `git status` and `git diff --stat`.

Report:

- Modified / added / deleted files (one line each)
- Whether there are untracked files that should be included
- Any obvious problems (merge conflicts, missing files)

Ask: _"Anything to add or exclude before committing?"_
Wait for answer.

---

## Step 3 — Determine branch name

Inspect the issue title and type to propose a branch name.

Rules:

- Bug fix → `fix/issue-{N}-{kebab-slug}`
- Feature / enhancement → `feat/issue-{N}-{kebab-slug}`
- Slug: lowercase, hyphens only, max 5 words, derived from issue title
- If current branch is already correctly named, skip branch creation

Propose: `"Branch: feat/issue-42-hdd-encoder-debounce — ok? (or give me a
name)"`

Wait for confirmation, then:

```bash
git checkout -b <branch-name>
```

---

## Step 4 — Stage and commit

Propose a commit message following this format:

```
<type>(scope): short imperative description (#N)

- bullet of what changed
- bullet of what changed
```

Where:

- `type` = `feat` | `fix` | `chore` | `docs` | `refactor` | `test`
- `scope` = short area of codebase (e.g. `firmware`, `schematic`, `pcb`,
  `ui`, `build`)
- `#N` = issue number

Show the full proposed commit message and ask: _"Commit message ok?"_

Wait for confirmation, then:

```bash
git add -A
git commit -m "<confirmed message>"
```

Add co-author trailer automatically:

```
Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
```

Per the DCO rule in CLAUDE.md, also append:

```
Signed-off-by: AristideBH <your-git-email>
```

If the git email is not known, ask for it once and remember it for the session.

---

## Step 5 — Push and open PR

Announce before pushing:

```
"Pushing to origin/<branch> and opening PR — ok?"
```

Wait for yes.

Then:

1. `git push -u origin <branch>`
2. Create the Pull Request on `AristideBH/spinPad` with the `gh` CLI
   (see `docs/agents/issue-tracker.md` — `gh` is the issue-tracker convention
   for this repo). Use a heredoc for the body:

   ```bash
   gh pr create \
     --base <base-branch> \
     --head <branch> \
     --title "<commit subject without #N>" \
     --body "$(cat <<'EOF'
   <body from template below>
   EOF
   )"
   ```

   - **title**: same as commit subject (without the `#N` suffix)
   - **body** (use this template):

```markdown
## Summary

<2–3 sentences describing what this PR does>

## Changes

- <bullet>
- <bullet>

## Related

Closes #<N>

---

_Co-authored with Claude. DCO: Signed-off-by AristideBH._
```

- **base branch**: `main` (or `dev` if it exists — check first with
  `git ls-remote --heads origin dev`)
- **head branch**: the branch just pushed
- **draft**: ask the user → _"Open as draft or ready for review?"_ — add
  `--draft` to the `gh pr create` call if draft.

`gh pr create` prints the PR URL on success. Report it.

---

## Step 6 — Move kanban card

This step is **always gated**. Never skip the confirmation.

Announce:

```
"Moving #<N> to Done on the SpinPad board — confirm? (y/n)"
```

Wait for explicit yes.

If yes, move the card with the `gh` CLI (Projects v2). Requires the token to
have the `project` scope — if `gh` returns a missing-scope error, tell the user
to run `gh auth refresh -s project,read:project` and skip this step.

```bash
# 1. find the project + its Status field option IDs
gh project list --owner AristideBH
gh project field-list <project-number> --owner AristideBH --format json
# 2. find the item id for issue #N
gh project item-list <project-number> --owner AristideBH --format json
# 3. set Status = Done
gh project item-edit \
  --id <item-id> \
  --project-id <project-id> \
  --field-id <status-field-id> \
  --single-select-option-id <done-option-id>
```

If no: leave the card where it is and tell the user.

---

## Step 7 — Session summary

Print a compact closing summary:

```
✓ Branch:   feat/issue-42-hdd-encoder-debounce
✓ Commit:   feat(firmware): debounce hdd encoder signal (#42)
✓ PR:       https://github.com/AristideBH/spinPad/pull/NN
✓ Kanban:   #42 → Done
```

Then stop. Do not suggest next tasks — that's session-start's job.

---

## Guardrails

- **Every write operation needs a confirmation**: branch creation, commit,
  push, PR creation, kanban move — each is a separate confirm.
- If any step fails (push rejected, `gh` error, etc.), stop, report the exact
  error, and ask how to proceed. Never silently retry.
- If the user wants to skip kanban update, respect it — just note it in the
  summary with `(skipped)`.
- If PR already exists for this branch, report its URL and skip to Step 6.
- Always use caveman mode: no filler, no congratulations, just facts.
