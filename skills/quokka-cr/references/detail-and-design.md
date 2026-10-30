# New, detail and design

## New

`new <idea>` adds one list row with status Proposed.

1. Restate the idea in two lines: the problem and why it matters. Ask one question only if the problem is unclear.
2. Pick the surfaces it touches from the project's `surfaces`. Say which ones you chose and why.
3. Search the list for a similar open CR. If one exists, show it and ask whether to add to it instead.
4. Allocate the next id (`lists.md`), write the row, and record `<system>:<login>` as the proposer.

The row needs no approval. Next: `/quokka:cr detail <id>`, unless the dev says the CR is simple enough to skip the detail (`identity-and-gates.md` §Skipping a part).

## Detail

`detail <CR-id>` writes the CR detail doc. It needs only the row.

1. **Explore the real code** for every repo role the surfaces map to.
   - Use CodeGraph when the clone has `.codegraph/` (`codegraph explore "<question>"`). Otherwise use grep/find.
   - Name actual files, screens, view models, endpoints and tables.
   - If a repo is not mapped locally, explore what you can and list the gap as an open question.
2. **Create the doc** named `<PFX>-CR-<n>-Detail <title>` in Claude Docs. Start from a skeleton, then fill each section:
   1. Problem: what is wrong today, for whom, with evidence
   2. Why now
   3. Proposal: what changes, in plain words
   4. Surfaces and screens affected: a table of surface → screen/route → change
   5. Repos touched: role → modules/files
   6. Data and API changes: models, endpoints, migrations, analytics events
   7. Edge cases and states: empty, loading, error, offline, permissions, dark mode
   8. Out of scope
   9. Acceptance criteria: numbered and testable. The build writes tests from these.
   10. Open questions: each with the person who can answer
3. Put the doc URL on the row (`artifacts.detail`).
4. Open the doc for the dev.

Keep project rules in mind, such as the INS rules in `deviceRules` (never name a nurse, SOS is single tap). A proposal that breaks one is wrong. Say so rather than writing it.

Next: `/quokka:cr design <id>`, unless the dev skips the design.

## Design

`design <CR-id>` builds the CR design canvas. It needs the detail doc, or a skipped detail with a `scope` on the row. If the detail is missing, offer to generate it first.

1. Read the detail (or the row's `scope`).
2. Read each touched surface's `*-Design-Main` canvas and `*-DS`. Match what is there: components, spacing, type, copy tone. A design that looks foreign to the main canvas is wrong.
3. Create a Claude Design canvas named `<PFX>-CR-<n>-Design <title>`.
   - Use `Artifact quickstart` with intent `design`, and the surface DS link (`design_systems: false`, then read the DS by its link).
   - Make **one page per surface** (App, Web Traveller, Web Creator, Web Admin, LG app, Connect app). Name it `<Surface>`.
   - Each page uses only its own surface's DS. Never mix design systems on one page.
4. On each page, show the full picture:
   - every new or changed screen
   - its states (empty, loading, error, success, dark mode where the app has it)
   - the flow between screens
   - a "before" board for screens that change
5. Add a note per board tying it to the detail section and acceptance criterion it covers (`AC-3`, `§7 offline`).
6. Put the canvas URL on the row (`artifacts.design`).
7. Open it for the dev.

If the design forces a change in the detail (a missing state, a new edge case), update the detail too, and tell the dev what changed.

Next: the dev reviews the detail and design, then runs `/quokka:cr approve <id>`.
