# Hand-off: a resumable state machine

The hand-off creates things outside Claude: canvas pages, tickets and Confluence pages. It must be safe to re-run at any point. State lives in the row's `handoff` field (`lists.md`), where every dev can see it.

## Preconditions

- The `design` gate is approved and nothing is stale. Re-check all three revisions now.
- The dev's login is known (`identity-and-gates.md`).

## States, in order

Steps 3 and 4 are chosen from the project file, not the project name: step 3 runs when `confluence` is set, step 4 when `approvers` is not empty. Today that means INS.

| # | State | Runs when |
|---|---|---|
| 1 | `canvas-copied` | always |
| 2 | `tickets-drafted` | always |
| 3 | `confluence-created` | `confluence` set |
| 4 | `named-approvals-done` | `approvers` not empty |
| 5 | `tickets-created` | always |
| 6 | `links-recorded` | always |

## Every step

1. Write `starting <step> at <design rev> by <login>` to the row.
2. **Reconcile.** Search the target for an existing item for this CR. If one exists, adopt it and do not create another.
3. Do the step.
4. Write `done <step>` with the ids or URLs created or adopted.

If the design revision on the row differs from the approved one, stop. The gate is stale.

The `handoff` record stores `detailRev` and `designRev`: the approved revisions it was run for. When a gate is re-approved at a new revision after a hand-off, `handoff <id>` refreshes it:
1. Set `handoff.state` back to `canvas-copied` pending, with the new revisions.
2. Re-run every step. Each reconciles to the existing items and updates them in place:
   - add or update the main canvas pages
   - edit ticket bodies to cite the new revisions
   - INS: update the Confluence page, which needs fresh named approvals
3. Nothing is created twice. `build` stays blocked until `links-recorded` at the new revisions.

## Step 1: copy to main

For each page of the CR design, copy it into the matching surface's `*-Design-Main` as page `<CR-id> <title>` (`artifacts.md` §Copying).

- Reconcile: a page whose name is the full CR id followed by a space (`QG-CR-10 ` never matches `QG-CR-100 …`).
- Never replace pages or boards outside the CR's own page. Inside it, replace a board only in a hash-verified refresh (`artifacts.md` §Copying, Refresh). Never touch the CR design itself.

## Step 2: draft tickets

There is one ticket per repo role touched. Show every draft to the dev and wait for their yes. Nothing is created yet.

**Title:** `<CR-id> <title> [<role>]`. Every ticket carries the CR id and its repo role, so each role's ticket can be found again on a re-run (`[app]`, `[web]`, `[lg-android]`).

**Labels:** the CR label (`tickets.label` with `{id}` filled in) plus a role label `cr-role-<role>`.

**Body:**
```
<problem, 2 lines>

Detail: <detail url> (rev <r>)
Design: <design url> (version <v>), page <Surface>
Main canvas: <main url>, page <CR-id> <title>

Acceptance criteria
- [ ] AC-1 …

Repo scope: <role> → <modules>
Related: <other ticket for the same CR, once created>
```

## Step 3 (`confluence` set): Confluence page

Create the page in the space and under the parent in `confluence` (`APP › Feature Requests`), titled `<CR-id> <title>`. Use the Atlassian MCP `createConfluenceContent`, or `acli` if it supports pages.

- Reconcile: search for a page with that exact title in the space.
- Content:
  1. Summary: plain words, for the product owner, stakeholders and support training
  2. The detail text
  3. Design screenshots per surface, exported from the CR design canvas
  4. A flow diagram
  5. The approval tracker table: Manager, Josh, Ticket, each with status and date, plus the exact comment to post: `Approved <CR-id> v<contentVersion>`
  6. Status: "Pending sign-off"
- Put the page URL, `contentHash` and `contentVersion` on the row.

## Step 4 (`approvers` not empty): named approvals

Read approvals as in `identity-and-gates.md` §Reading a Confluence approval.

- **Both present, in order, from the listed account ids:** record them, then move on.
- **Otherwise:** stop. Report who is still pending and the page link.
  Next: `/quokka:cr handoff <id>` once they have approved.
- **An approver account id is null:** stop and ask Tam for it.

## Step 5: create tickets

Create the drafts the dev approved in step 2.

**QG (GitHub):**
- Use `gh issue create --repo <tickets.byRepo[role]> --title … --body … --label <cr label> --label cr-role-<role>`. Create the labels if they are missing.
- Reconcile with `gh issue list --repo … --search "<CR-id> in:title" --label cr-role-<role> --state all`.
- When there are two issues, edit each body to link the other.

**INS (Jira):**
- Use `acli jira workitem create --project <tickets.project> --summary "<CR-id> <title>" --label <cr label>,cr-role-<role> …` with the Confluence page link in the description. One ticket per repo role.
- Reconcile per role with JQL `project = <tickets.project> AND labels = "<cr label>" AND labels = "cr-role-<role>"`.
- Update the Confluence tracker's Ticket row with the key. Edit only the tracker table, so the approvals' content hash is unchanged (`identity-and-gates.md`).

## Step 6: record links

Write tickets, Confluence URL and main-canvas page names to the row. Set status Handed-off and `handoff.state = links-recorded`.

Next: `/quokka:cr build <id>`.

## Resume

`handoff <id>` and `resume` read `handoff.state` and the last `starting` line without a matching `done`. Re-run that step from its reconcile, since the step may have half-finished. Never assume a `starting` step failed to create its item.
