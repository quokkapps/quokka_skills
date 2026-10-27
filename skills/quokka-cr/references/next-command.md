# Next command

Every sub-command ends with one line: what is done, then the exact command to run next. Work it out from the CR's row, not from what just ran. When something blocks, name the blocker and the command that clears it.

| Row state | Next |
|---|---|
| no row | `/quokka:cr new <idea>` |
| row pending | `/quokka:cr approve <id> row` |
| row approved, no detail | `/quokka:cr detail <id>` |
| detail exists, pending | `/quokka:cr approve <id> detail` (after reviewing <detail url>) |
| detail approved, no design | `/quokka:cr design <id>` |
| design exists, pending | `/quokka:cr approve <id> design` (after reviewing <design url>) |
| any gate stale | re-approve the first stale gate: `/quokka:cr approve <id> <gate>` |
| design approved, hand-off not started or part done | `/quokka:cr handoff <id>` |
| INS, waiting on named approvals | "Waiting for <Manager/Josh> on <Confluence link>. Re-run `/quokka:cr handoff <id>` after they approve." |
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
