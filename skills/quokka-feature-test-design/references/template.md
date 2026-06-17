# Output template

A HEADER, then TWO clearly separated sections: the Must-Test 20% first, then Extended coverage.

## Header
- Feature summary (2–3 sentences) + links (epic key, design).
- Stack(s): Android / iOS / KMP.
- Interview checklist: each of the 9 items marked Resolved / Waived(reason).
- **One line: why these are the must-test 20%.**

## Section 1 — ▶ MUST-TEST 20% (dev executes these)
The load-bearing cases. Columns, in order:

`TC ID | Risk | Test Area | Coverage | Title | Preconditions | Test Steps | Expected Result | Expected Integration | Done?`

- **Risk**: High/Med/Low (from `likelihood × impact × cost-of-failure`).
- **Test Area**: breadcrumb, e.g. `Home > Welfare Check > Due now`.
- **Coverage**: how the dev covers it — `manual` and/or `unit` / `ui` / `e2e` (see automation-tiers.md). KMP shared logic → `commonTest`.
- **Test Steps**: numbered list.
- **Expected Result**: group as `Verify after step #N:` bullet lists.
- **Expected Integration**: layered bullets — `App UI:`, `Backend/API:`, `Notification:` — what fires / is suppressed (routes, records, pushes).
- **Done?**: `☐` checkbox the dev ticks after executing.

## Section 2 — Extended coverage (automate / skip)
Everything not in the 20%. Same columns minus Done?, plus an outcome:

`TC ID | Risk | Test Area | Coverage | Title | Expected Result | Outcome`

- **Outcome**: `automate` (with tier) or `skip`.

### Consciously skipped (why)
| Skipped case | Why skipped |
|---|---|
| <case> | <risk too low / redundant with TC#N / out of scope> |
