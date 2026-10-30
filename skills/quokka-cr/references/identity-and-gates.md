# Identity and gates

## Who is running this

All devs share one Claude account, so the Claude login names nobody. Read the dev's own tool login instead, at the start of every run that writes anything.

| Needed for | Command | Identity |
|---|---|---|
| GitHub (QG, `share-project`) | `gh api user --jq .login` | `github:<login>` |
| Bitbucket (INS code) | `git -C <clone> config user.email`, plus a Bitbucket API call with the dev's app password if one is set up | `bitbucket:<user>` |
| Atlassian (INS tickets, Confluence) | `acli jira auth status` | `atlassian:<accountId>` |

Use the login of the system the project's tickets live in (`tickets.system`). QG means GitHub. INS means Atlassian. Record it as `<system>:<login>` on every gate event, ledger entry and hand-off step.

No login means no write. Read-only work may continue: listing CRs, reading a detail. Tell the dev which login to run (`gh auth login`, `acli jira auth login`).

## The build approval

The CR row is always treated as approved. Anyone may run `detail`, `design` or `approve` on any open CR. There is one human gate before code: the **build approval**. It locks exactly what the dev reviewed.

| Part | Recorded | How to read the current one |
|---|---|---|
| `detail` | the Claude Docs doc revision, or `skipped` | `read` the doc and take its `rev`/version |
| `design` | canvas version id + sha256 of its board files, sorted by path, or `skipped` | Artifact `read` (header gives the version) and `list` with `scope: "files"`, then hash each board file |
| `scope` | only when the detail is skipped: sha256 of the row's `scope` field | re-read the row and hash the same field |

The approval can be:

| State | Meaning |
|---|---|
| `pending` | not approved yet |
| `approved` | approved, and every part is still at the recorded revision |
| `stale` | a part changed after approval, or a part recorded as `skipped` now has an artifact |

Check the approval on every run that touches the CR, and show a stale one in the list.

## Missing detail or design

When a dev runs any command on a CR id and the approval is pending or stale, check what exists, in order:

1. **No detail, and not skipped** (no `skipped.detail` on the row): say it is missing and offer to generate it. On yes, run `detail` (`detail-and-design.md`), then go on to the design.
2. **No design, and not skipped** (no `skipped.design`): say it is missing and offer to generate it. On yes, run `design`.
3. **Both there (or skipped):** give the dev the links to review, then ask for `/quokka:cr approve <id>`.

Ask before generating. Never generate without the dev's yes.

### Skipping a part

If the dev says the CR can start without a detail or a design (the ticket is too simple, there is no UI change), respect that. Record the part as `skipped` on the row with the dev's reason, `<system>:<login>` and the date.

- **Detail skipped:** write a short `scope` on the row instead: what changes, the repo roles touched, and numbered acceptance criteria (AC-1, AC-2, …). Show it to the dev. It is part of what they approve, and the build writes its tests from these criteria.
- **Design skipped:** if the change has visible UI, say so once, then respect the dev's call. The hand-off skips the canvas copy, and tickets say `Design: skipped (<reason>)`.
- Only the dev's words skip a part. Never skip one on your own judgment.

## `approve <CR-id> [name]`

A word after the CR id is the display name. An old gate word (`row`, `detail`, `design`) is ignored. Say that there is now one approval.

1. The detail must exist or be skipped, and so must the design. Otherwise offer to generate the missing part (above) and stop.
2. Read the dev's login. Read the current revision of every part.
3. Show the dev what they are approving:
   - detail: link and revision, or `skipped (<reason>)` with the scope and its criteria
   - design: link and version, or `skipped (<reason>)`
4. Ask them to confirm they reviewed it and want it built.
5. Write `gates.build` to the row (`lists.md`): `{state: approved, detailRev, designRev, scopeHash, by: <system>:<login>, name, date}`. Use `skipped` for a skipped part's revision. Set status Approved.
6. Start the hand-off (`handoff.md`) unless the dev says not to.

Anyone with a login may approve a QG CR. This is an attestation by a known account, not proof. Say so if asked.

### Rows from v1.4

Rows written by v1.4 carry `gates.row`, `gates.detail` and `gates.design`. Ignore `gates.row`. If `detail` and `design` are both approved and neither is stale, treat them as one build approval at those revisions, approved by the design approver. Write `gates.build` from them on the next write to that row.

## Sign-off

A project with a `signoff` list (INS: Manager, Josh) runs the same flow as QG. The only extra is one question before the build starts:

"Has <CR-id> been approved by Manager and Josh?" (name the project's `signoff` roles, in order, and give the Confluence link if there is one)

- **Yes:** record `signoff: {state: approved, by: <system>:<login>, date}` on the row and start the build.
- **No:** offer to start anyway. On yes, record `signoff: {state: pending, by, date}` and build. Ask again on every resume and before the push. The push and PR wait for a yes; local work does not.
- **Changed after approval:** if a hand-off refresh rewrites the Confluence page, set the sign-off back to `pending`.

The skill does not read approvals from Confluence. The dev's answer, recorded with their login, is the record.
