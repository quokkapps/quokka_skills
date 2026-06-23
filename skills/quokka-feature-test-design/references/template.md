# Output template

A HEADER, then TWO clearly separated sections: the Must-Test 20% first, then Extended coverage.

## Header
- Feature summary (2–3 sentences) + links (epic key, design).
- Stack(s): Android / iOS / KMP.
- Interview checklist: each of the 9 items marked Resolved / Waived(reason).
- **One line: why these are the must-test 20%.**

## Section 1 — ▶ MUST-TEST 20% (dev executes these)
The load-bearing cases. Columns, in order:

`TC ID | Risk | Test Area | Coverage | Title | Preconditions | Test Steps | Expected Result | Expected Integration | Done (Dev / QA)`

- **Risk**: High/Med/Low (from `likelihood × impact × cost-of-failure`).
- **Test Area**: breadcrumb, e.g. `Home > Welfare Check > Due now`.
- **Coverage**: how the dev covers it — `manual` and/or `unit` / `ui` / `e2e` (see automation-tiers.md). KMP shared logic → `commonTest`.
- **Test Steps**: one action per line as a numbered list — each step is its own list item, never a single run-on `1. … 2. …` paragraph.
- **Expected Result**: bullet list. Lead with `Verify after step #N:` then one bullet per assertion — each its own list item.
- **Expected Integration**: bullet list, one per layer — `App UI:`, `Backend/API:`, `Notification:` — what fires / is suppressed (routes, records, pushes).
- **Done (Dev / QA)**: two checkboxes per row — `Dev ☐` (dev ticks after executing) and `QA ☐` (QA ticks after verifying). In Confluence these are two interactive task checkboxes; in the local `.md` write `Dev ☐ / QA ☐`.

## Section 2 — Extended coverage (automate / skip)
Everything not in the 20%. Same columns minus Done?, plus an outcome:

`TC ID | Risk | Test Area | Coverage | Title | Expected Result | Outcome`

- **Outcome**: `automate` (with tier) or `skip`.

### Consciously skipped (why)
| Skipped case | Why skipped |
|---|---|
| <case> | <risk too low / redundant with TC#N / out of scope> |
