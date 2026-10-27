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

## Gates

Each CR has three gates in order: `row`, then `detail`, then `design`. A gate can be:

| State | Meaning |
|---|---|
| `pending` | not approved yet |
| `approved` | approved at revision R, and the artifact is still at R |
| `stale` | approved at R, but the artifact has moved on, or an upstream gate is stale |

## What revision means

| Gate | Revision recorded | How to read the current one |
|---|---|---|
| `row` | hash of the row's problem, why and surfaces fields | re-read the row and hash the same fields |
| `detail` | the Claude Docs doc revision | `read` the doc and take its `rev`/version |
| `design` | canvas version id + sha256 of its board files, sorted by path | Artifact `read` (header gives the version) and `list` with `scope: "files"`, then hash each board file |

When the current revision differs from the recorded one, that gate and every later gate are stale. Check every gate on every run, and show stale gates in the list.

## `approve <CR-id> [gate] [name]`

The gate is optional. Without it, approve the **first gate that is pending or stale**, in order row, detail, design, and name it in the confirmation. A word after the CR id that is not `row`, `detail` or `design` is the display name. Pass the gate only to pick one explicitly.

1. The gate before this one must be approved and not stale. Otherwise name the blocker and stop.
2. The gate's artifact must exist: row, detail doc or design canvas.
3. Read the dev's login. Read the current revision.
4. Show the dev what they are approving, at what revision, and ask them to confirm.
5. Write the approval to the row (`lists.md`): gate, revision, `<system>:<login>`, optional display name, date (YYYY-MM-DD).
6. Set the row status:
   - `row` → Approved
   - `detail` → Detailed
   - `design` → Designed
7. `design` approval starts the hand-off (`handoff.md`) unless the dev says not to.

Anyone with a login may approve a QG gate. This is an attestation by a known account, not proof. Say so if asked.

## INS named approvers

`ins.json` lists the approvers for the `design` gate in order: Manager, then Josh.

- Approving the INS `design` gate records the dev's attestation as usual. That only opens the hand-off.
- The named approvals happen on the Confluence page (`handoff.md` step 3). Each approver approves there with their own Atlassian account.
- A name typed into this skill never counts as a named approval.
- If an approver's `atlassianAccountId` is null in the project file, stop at `named-approvals-done`. Tell the dev to ask Tam for the ids, and to update `projects/ins.json` through a PR to `quokka_skills`.

### Reading a Confluence approval

**Content hash:** sha256 of the page body with the approval tracker table and the status line removed. The skill edits only those two parts after sign-off (ticket key, "Shipped"), so its own edits never change the hash.

**Content version:** the row stores `confluence.contentHash` and `confluence.contentVersion`, the page version at which the hash last changed. Update both whenever the skill writes content (create, hand-off refresh). On every read, if the current hash differs from the stored one, someone else changed the content. Save the new hash as `contentHash` and the current page version as `contentVersion`, and treat every earlier approval as stale.

An approval counts only if it was given **at or after `contentVersion`**:
1. If the page has approval or workflow data (the space's page-approval app), read it through the Confluence REST API or the Atlassian MCP `getConfluenceContent`. Count only approvals whose `accountId` matches and whose page version is at or after `contentVersion`.
2. Otherwise, read the page's footer comments. An approval is a comment whose body starts with `Approved <CR-id> v<contentVersion>` (the tracker shows the exact text to post), whose author `accountId` matches, and which was created after `contentVersion` was published. A comment citing an older version does not count.
3. Order matters. The Manager's approval must be dated before Josh's.
4. Record each approval on the row: approver role, account id, date, and the `contentVersion` it covers.

Never assign the current hash or version to an approval that was given earlier. After the first approval, never edit outside the tracker and status line, except in a hand-off refresh, which needs fresh approvals.
