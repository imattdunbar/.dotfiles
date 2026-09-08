---
name: summarize-work
description: 'Handoff-summary writer. Produces a context-dense markdown file another LLM can
pick up and continue from, with zero session memory required.'
---

## Trigger

The user says **summarize-work** (or "summarize the thing we just did"), **plus
anything they type after it**. The trailing instruction is a scope override —
always obey it:

- `summarize-work` alone → default scope: everything material in the full
  session context.
- `summarize-work this specific feature, and only the newest implementation` →
  narrow scope: that feature's final state only. Superseded designs get a
  one-line "rejected alternatives" note, never equal billing.
- `summarize-work but skip the frontend` / `...only the infra` → exclude /
  include accordingly, and say what's excluded.

If the trailing instruction is ambiguous about scope, ask one question before
writing. Otherwise proceed — don't interrogate.

## Workflow

1. **Inventory the work.** `git status`, `git log --oneline` (recent commits),
   `git diff --stat` / `git show --stat`. Uncommitted changes count the same
   as committed ones — enumerate both.
2. **Read final states, not diffs.** For every touched file that matters, read
   the current file content. Diffs tell you what moved; only the final file
   tells the next LLM what's true now. Skim tests, config, and infra files
   that constrain the work (env vars, terraform, deploy matrices, mocks)
   even when untouched, if the summary's claims depend on them.
3. **Write `~/Desktop/<Topic>Details.md`** (PascalCase topic, `Details` suffix)
   with these sections, trimmed to what exists:
   - What it does (3 sentences max)
   - End-to-end flow (request → response chain with file:line refs)
   - Files, grouped by area, each with its one-line role
   - Contracts (event schemas, route shapes, SSE events, key formats)
   - Key decisions + rejected alternatives (the "don't regress these" list —
     most valuable section; include _why_, not just _what_)
   - Gotchas (envelope shapes, silent-failure modes, ordering constraints
     like terraform-before-deploy, test-env gaps)
   - How to verify locally (commands, ports, expected outputs)
   - Open threads (explicitly not started)
4. **Report back briefly:** path written + the 3 decisions most likely to be
   regressed. Keep it short — the doc is the deliverable.

## Rules

- Final implementation only, unless the user asked for history. Dead ends get
  one line under rejected alternatives.
- Every non-obvious claim cites a `file:line` or commit hash. No folklore.
- Note what you did NOT verify (no test runs, no deploys) when true.
- Never include secrets, tokens, or env values — names and shapes only.
