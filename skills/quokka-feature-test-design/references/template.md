# Output Template (Phase 4)

The document has a HEADER, then the test-case TABLE, then the SKIPPED appendix.

## Header
- Feature summary (2–3 sentences) + links (epic key, design).
- Stack detected.
- Dimension scorecard: each of the 9 marked Resolved / Waived(reason).
- 80/20 rationale paragraph (why the kept cases are load-bearing).

## Test-case table — 12 columns, in this exact order
`TC ID | Priority | Risk | Feature | Test Area | Test Type | Title | Preconditions | Test Steps | Expected Result | Expected Integration | Result`

Authoring rules (mirror the Care Plan Tasks sample):
- **TC ID**: `TC#1`, `TC#2`, … sequential.
- **Priority**: P1/P2/P3 from risk-scoring. **Risk**: High/Med/Low.
- **Test Area**: breadcrumb, e.g. `Home screen > Single Schedule > Due now`.
- **Test Steps**: numbered list.
- **Expected Result**: group assertions as `Verify after step #N:` bullet lists.
- **Expected Integration**: layered sub-headings — `CP Desktop:`, `Notification:`, `Backend/API:` — each a bullet list of checks (API routes/records, notifications fired/suppressed). Layer UI → integration → backend/API → notification.
- **Result**: leave blank (filled during execution).

## Skipped appendix
Render the "Consciously skipped (why)" table from risk-scoring.md after the main table.
