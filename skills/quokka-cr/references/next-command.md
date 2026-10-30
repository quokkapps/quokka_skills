# Next command

Every sub-command ends with one line: what is done, then the exact command to run next. Prefer `/quokka:cr <id>` as the next command: it runs whatever step the row needs. Name the explicit step only when it says more (for example, after a skip). Work it out from the CR's row, not from what just ran. A command with a CR id never carries `--project`; the prefix names the project. When something blocks, name the blocker and the command that clears it.

| Row state | Next |
|---|---|
| no row | `/quokka:cr new <idea>` |
| no detail (not skipped) | `/quokka:cr detail <id>` (or tell me to skip it for a simple CR) |
| no design (not skipped) | `/quokka:cr design <id>` (or tell me to skip it, e.g. no UI change) |
| detail and design ready, approval pending | `/quokka:cr approve <id>` (after reviewing <detail url> and <design url>) |
| approval stale | `/quokka:cr approve <id>` (after reviewing what changed) |
| approved, hand-off not started or part done | `/quokka:cr handoff <id>` |
| hand-off done for older revisions than the current approval | `/quokka:cr handoff <id>` (refreshes it) |
| built, sign-off pending | "Commits ready; waiting for <signoff roles> to approve. Run `/quokka:cr <id>` once they have." |
| `links-recorded`, no build | `/quokka:cr build <id>` |
| build in flight | `/quokka:cr resume` |
| commits ready, no PR | push and open the PR (the skill asks yes/no) |
| PRs open | merge on GitHub/Bitbucket, then `/quokka:cr close <id>` |
| some PRs merged | "Waiting on <PR links>", then `/quokka:cr close <id>` |
| Done, design still exists | nothing for devs. Tam runs `/quokka:cr cleanup` now and then. |

Format:

```
Done: <one line>.
Next: /quokka:cr <command>
```

Bare `/quokka:cr` shows a `Next` column for every open CR instead.

## Drive: `/quokka:cr <CR-id>`

Read the row and run the first step it needs, using the table above. Then stop at the next human checkpoint.

0. **Done or Rejected:** say so and stop. Never offer to regenerate an artifact that `cleanup` removed.
1. **No detail or design, and not skipped:** offer to generate the missing one (`identity-and-gates.md` §Missing detail or design). On yes, generate it. If the dev says it is not needed, record the skip.
2. **Approval pending or stale:** show what to review and ask for the approval (`identity-and-gates.md` §`approve`).
3. **Approved, hand-off not finished, or its `detailRev`, `designRev` or `scopeHash` differ from the current approval:** run `handoff` (`handoff.md`), which refreshes an outdated one. It still shows ticket drafts before creating them.
4. **`links-recorded`, no build:** say what the build will do (repos, branch, size), and start on the dev's yes (`build.md`).
5. **Build in flight:** resume it (`build.md` §Resume).
6. **Sign-off pending, build done:** first compare the ledger's `detailRev`, `designRev` and `scopeHash` with the current approval (`build.md` §Resume). If they differ, re-check the work against the new revisions before anything else. Then ask the sign-off question again. Yes: push and open the PR (still asks). No: stop.
7. **PRs open:** report their state. Once every PR is merged, offer to run `close` (`close-and-cleanup.md`).

One run may cover several steps when the dev says yes at each checkpoint. Never pass a checkpoint without the dev's yes: generating an artifact, approving, creating tickets, starting a build, pushing, closing.
