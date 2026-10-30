# Build

`build <CR-id>` turns an approved, handed-off CR into local commits and a proposed PR per repo.

## Preconditions (check all, then report every one that fails)

1. The row reads `handoff.state = links-recorded`.
2. The build approval is approved at the current revisions. Re-read the detail and design (or the row's `scope`) now.
3. The hand-off's recorded `detailRev`, `designRev` and `scopeHash` equal the current approved ones. If the CR was re-approved after the hand-off, the canvas copies, tickets and INS sign-off describe the old version. Stop and run `/quokka:cr handoff <id>` to refresh them.
4. Every repo role the detail (or the `scope`) names is mapped in the local file.
5. Each mapped clone passes the identity check (`setup.md` step 2).
6. The dev's login is known.
7. `signoff` not empty (INS): ask the sign-off question (`identity-and-gates.md` §Sign-off). This never blocks the build; a `no` only holds the push and PR.

If any fail, stop and say exactly which, with the command that clears each.

## Set up, per repo role touched

1. `git -C <clone> fetch <remote>` (the remote saved at setup), then read the default branch (`defaultBranch`, or `git symbolic-ref refs/remotes/<remote>/HEAD`).
2. Create a worktree on a new branch `<PFX>-CR-<n>-<slug>` from `<remote>/<default>`.
   - Put it next to the clone: `<clone>-<cr-id-lowercase>`.
   - If the branch exists, reuse it and its worktree. That counts as a resume.
3. Copy each `gitignoredFiles` entry from `secretsFrom[role]` into the worktree.
   - Copy each file. Never print its contents.
   - Confirm git still ignores it: `git check-ignore`.
4. Create the repo ledger at `<worktree>/.quokka/cr/<CR-id>/`, with `progress.md`, `decisions.md`, `uat.md` and a `reviews/` folder. Write the approved `detailRev`, `designRev` and `scopeHash` at the top of `progress.md`.
   - Make sure `.quokka/` is ignored (`git check-ignore .quokka`). If it is not, append it to the file that `git -C <worktree> rev-parse --git-path info/exclude` prints. In a linked worktree `.git` is a file, so never write to `.git/info/exclude` directly. Never edit the repo's `.gitignore` for this.
5. Write the repo's branch and worktree to the row's `ledger`, with `required: true` for every repo role the approved detail (or `scope`) names. `close` uses that list.

## Size the work (state the call to the dev)

**Small:** one surface, and roughly one screen or one flow. One builder agent (`builder-brief.md`) runs:
1. tests first
2. the module gate
3. the Codex review loop
4. screenshots
5. the finish

**Large:** anything else.
1. Write a plan with `superpowers:writing-plans` into the repo ledger (`plan.md`), with a task queue.
2. Run one implementer per task, **serially**. Never run parallel lanes in one repo.
3. Repos for different roles may run one after another or in parallel, at most one builder per repo.
4. Use tiered gates:
   - per commit: the `targeted` gate
   - per task: the `module` gate
   - before the PR: the `full` gate
5. You act as the orchestrator, like a CTO. Log every call you make in `decisions.md`, with the date and why.

## Watching builders

Builders run as background agents.

- A "running" status is not progress. Check the builder's transcript and worktree file mtimes.
- After about 12 minutes with no change, message the builder.
- After about 20 minutes, stop it. Read its ledger and start a fresh builder from `progress.md`.
- Ask each builder to write a heartbeat line to `progress.md` at every step.

## Review

After each task (large) or once (small), run a Codex review on the branch:

```
node <codex plugin>/scripts/codex-companion.mjs review --wait --base <remote>/<default> --scope branch --cwd <worktree>
```

Find the plugin path with `ls ~/.claude/plugins/cache/*/codex/*/scripts/codex-companion.mjs`, or under `$CLAUDE_CONFIG_DIR`.

- Save the output to `reviews/<n>.md`.
- Always fix P1 and P2.
- Fix P3 when it is cheap. Otherwise log it in `decisions.md`.
- Re-review until clean.
- If Codex is missing or fails twice, use a Claude reviewer subagent and **say so** in the ledger and to the dev.

## Proof screenshots

Capture every changed screen on the configured devices only, in light and dark where the app has themes.

| Kind | How |
|---|---|
| Android | Install with `adb -s <emulator> install -r <apk>`. Launch with the project's `staging.launch`. Capture with `adb -s <emulator> exec-out screencap -p > <file>`. |
| iOS | XCUITest on the simulator UDID, or `xcrun simctl io <udid> screenshot <file>` |
| Web | browser screenshots at 390px and 1440px |

- Save to `screenshot/<CR-id>/<description>_<android|ios|web>.png` under the folder the session started in.
- If that folder is a git repo and `screenshots.commit` is false, add `screenshot/` to its `.gitignore`. Ask the dev first if the `.gitignore` is tracked.
- Repo screenshot tests (Roborazzi baselines and the like) stay in the repo as usual.

Use the test account from the project's pointer. Ask the dev for credentials and never write them to a file.

## Finish, per repo

1. Run `/simplify` on the branch, unless it already ran after the last code change (check `decisions.md`). If it changed code, run the Codex review loop again until clean.
2. Run the `full` gate in the foreground. If it fails, fix and re-run. Never skip it.
3. Make local commits. Use messages like `feat(<scope>): … (<CR-id>)`.
4. Show the draft PR:
   - title `<CR-id> <title>`
   - body: what changed, the ticket, detail and design links, a screenshot list, open UAT rows from `uat.md`, and the gate output summary
5. Sign-off pending (`signoff` not empty and the row says `pending`): ask the sign-off question again. Still no: keep the local commits, push nothing, and stop with `Next: /quokka:cr <id>` once it is approved.
6. Ask: "Push `<branch>` and open this PR from your account?"
   - Only on yes: `git push -u <remote> <branch>`, then `gh pr create` (GitHub) or the Bitbucket CLI or API (Bitbucket).
   - Never merge. Never force-push.
7. Write the PR URL to the row's `ledger`. Set status In progress.

Next: `/quokka:cr close <id>` once every PR is merged.

## Resume

`resume` (or `build <id>` again) finds an in-flight build:
1. the row's `ledger`
2. each worktree's `.quokka/cr/<CR-id>/progress.md`

Then:
1. Re-check the preconditions. A stale approval stops the resume. A pending sign-off is asked again.
2. Compare the `detailRev`, `designRev` and `scopeHash` at the top of `progress.md` with the current approved ones. If they differ, the work was done for an older version. Mark every done task as needing re-check, re-plan against the new revisions (large), and tell the dev what changed.
3. Continue from the last task not marked done.
4. Re-run that task's gate first, since its last state is unknown.
