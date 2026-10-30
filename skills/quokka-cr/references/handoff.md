# Hand-off: a resumable state machine

The hand-off creates things outside Claude: canvas pages, tickets and Confluence pages. It must be safe to re-run at any point. State lives in the row's `handoff` field (`lists.md`), where every dev can see it.

## Preconditions

- The build approval is approved and not stale. Re-check every part's revision now.
- The dev's login is known (`identity-and-gates.md`).

## States, in order

Step 3 is chosen from the project file, not the project name: it runs when `confluence` is set. Today that means INS. The INS sign-off is not a hand-off step; the build asks about it (`build.md` precondition 7).

| # | State | Runs when |
|---|---|---|
| 1 | `canvas-copied` | always |
| 2 | `tickets-drafted` | always |
| 3 | `confluence-created` | `confluence` set |
| 4 | `tickets-created` | always |
| 5 | `links-recorded` | always |

## Every step

1. Write `starting <step> at <design rev> by <login>` to the row.
2. **Reconcile.** Search the target for an existing item for this CR. If one exists, adopt it and do not create another.
3. Do the step.
4. Write `done <step>` with the ids or URLs created or adopted.

If the detail or design revision, or the `scope` hash, differs from the approved one, stop. The approval is stale.

The `handoff` record stores `detailRev`, `designRev` and `scopeHash`: the approved revisions it was run for. A changed `scopeHash` counts as a new revision even when both revisions read `skipped`. When the CR is re-approved at new revisions after a hand-off, `handoff <id>` refreshes it:
1. Set `handoff.state` back to `canvas-copied` pending, with the new revisions.
2. Re-run every step. Each reconciles to the existing items and updates them in place:
   - add or update the main canvas pages
   - edit ticket bodies to cite the new revisions
   - INS: update the Confluence page, which sets the sign-off back to `pending`
3. Nothing is created twice. `build` stays blocked until `links-recorded` at the new revisions.

## Step 1: copy to main

Design skipped: mark this step done with `skipped` and move on.

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

Detail: <detail url> (rev <r>)   or: Scope: <row scope>, detail skipped (<reason>)
Design: <design url> (version <v>), page <Surface>   or: Design: skipped (<reason>)
Main canvas: <main url>, page <CR-id> <title>   (omit when the design is skipped)

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
  2. The detail text, or the row's approved `scope` (what changes, repos, acceptance criteria) when the detail is skipped
  3. Design screenshots per surface, exported from the CR design canvas (omit when the design is skipped)
  4. A flow diagram
  5. The sign-off tracker table: one row per `signoff` role, plus Ticket, each with status and date
  6. Status: "Pending sign-off"
- Put the page URL on the row.

## Step 4: create tickets

Create the drafts the dev approved in step 2.

**QG (GitHub):**
- Use `gh issue create --repo <tickets.byRepo[role]> --title … --body … --label <cr label> --label cr-role-<role>`. Create the labels if they are missing.
- Reconcile with `gh issue list --repo … --search "<CR-id> in:title" --label cr-role-<role> --state all`.
- When there are two issues, edit each body to link the other.

**INS (Jira):**
- Use `acli jira workitem create --project <tickets.project> --summary "<CR-id> <title>" --label <cr label>,cr-role-<role> …` with the Confluence page link in the description. One ticket per repo role.
- Reconcile per role with JQL `project = <tickets.project> AND labels = "<cr label>" AND labels = "cr-role-<role>"`.
- Update the Confluence tracker's Ticket row with the key. Edit only the tracker table.

## Step 5: record links

Write tickets, Confluence URL and main-canvas page names to the row. Set status Handed-off and `handoff.state = links-recorded`.

Next: `/quokka:cr build <id>`.

## Resume

`handoff <id>` and `resume` read `handoff.state` and the last `starting` line without a matching `done`. Re-run that step from its reconcile, since the step may have half-finished. Never assume a `starting` step failed to create its item.
