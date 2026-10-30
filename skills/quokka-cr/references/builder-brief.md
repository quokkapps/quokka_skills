# Builder brief template

Fill every `<…>` and paste the result as the builder agent's prompt. The brief is all the builder knows, so keep it complete. Paste device rules verbatim from the project file.

```markdown
You are building <CR-id> <title> in one repo. Work only in this worktree:
<worktree path> (branch <branch>, base <remote>/<default>).

## What to build
Implement exactly the approved revisions below, nothing more:
- Detail: <detail url> (rev <r>). Read it first. Acceptance criteria: <AC list>.
  <Detail skipped: Scope: <row scope>. Acceptance criteria: <AC list from the scope>.>
- Design: <design url> (version <v>), page <Surface>. Match it on <DS name>.
  <Design skipped: No design. Follow the existing screens and <DS name>.>
<Large builds only: Your task is <task n> of plan <ledger>/plan.md: <task text>.>

If the design or detail is silent on something, decide, write the decision
and why in <ledger>/decisions.md, and keep going. Do not ask unless the
choice would contradict the detail.

## How
1. Write the failing test first. Run it and paste the red output into
   <ledger>/progress.md.
2. Make it pass. Keep changes inside the modules the detail names.
3. Gates:
   - after each commit: <targeted gate>
   - before you report: <module gate>
   - <Small builds also: the full gate: <full gate>>
4. Commit locally with messages `<type>(<scope>): … (<CR-id>)`.
   Never push. Never merge. Never rewrite history.
5. Write a heartbeat line to <ledger>/progress.md at every step:
   `YYYY-MM-DD HH:MM <what you are doing>`.

## Environment
<env lines, e.g. JAVA_HOME=…>
Git-ignored files are already copied in. Never commit them, print them or move them.

## Device rules (verbatim, never break)
<deviceRules, one per line>

## Untestable checks
Anything you cannot verify yourself goes in <ledger>/uat.md as a row
`| # | check | how to verify | expected |`. This covers real sign-in, store
sandboxes, email inboxes, real devices and push delivery. Do not spend time
on these, and do not drop them silently.

## Anti-stall rules
- Never use `nohup`, a trailing `&`, `disown`, `setsid`, `rm -rf`, or heredoc
  file writers (`cat > file <<EOF`). Use the Write and Edit tools for files.
- Run gates, builds and reviews in the foreground with a 600 s timeout. Split
  anything longer than 9 minutes into chunks (one module at a time).
- Never end your turn while a job is still running.
- If a command fails or hangs twice, stop and report what you saw.

## Report
When done, reply with:
- what changed (files, one line each)
- the test names you added and the gate result lines
- the decisions you logged
- the UAT rows you added
- anything left undone and why
```
