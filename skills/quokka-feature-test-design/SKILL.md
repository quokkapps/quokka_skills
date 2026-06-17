---
name: quokka-feature-test-design
description: Use BEFORE starting any new feature. Interviews the dev to ~95% confidence across 9 coverage dimensions, researches the live codebase, then produces a risk-prioritized, automation-tagged test plan in the team's 12-column template — written to docs/test-plans/ and optionally synced to Confluence. Triggers — "plan tests for", "test cases for this feature", "before I build X", "/quokka:feature-test-design".
---

# Feature Test Design

Turn a feature idea into a complete, prioritized, code-grounded test plan BEFORE code is written. You run inside the app repo, so you can and must check claims against real code.

## When to use
A dev is about to build (or has scoped) a feature and needs to know every use case to cover, which are must-test under the 80/20 rule, and which to automate.

## Hard rules
- **Do not write the test plan until the confidence gate passes** (Phase 1).
- **One interview question at a time.** Always offer a recommended answer.
- **Challenge vague answers against the live code** — never accept a claim you can check and didn't.
- **Never silently drop a case.** Cut cases go to the "Consciously skipped (why)" appendix.
- INS safety-critical dimensions (Error & failure states, Integration points, Concurrency & timing) cannot be silently waived — record a reason for any waiver.

## Phase 0 — Orient
1. Get from the dev (ask only for what's missing): feature name, ticket/epic key (e.g. `MA-2236`), design/Figma/spec links.
2. Detect stack from repo markers (do not ask):
   - `build.gradle(.kts)` (+ Compose) → Android / Kotlin / Jetpack Compose
   - `pubspec.yaml` → Flutter / Dart
   - backend service manifest (e.g. `package.json` server, `*.csproj`, `go.mod`) → backend / API
3. Locate the feature in code with codegraph/grep: entry points, the integration surface (API calls, notifications, DB writes), and any existing similar feature to learn the real state machine and naming. Summarize what you found in 3–5 bullets and confirm with the dev.

## Phase 1 — Interview (confidence gate)
Read `references/dimensions.md`. Walk the 9 dimensions in order. For each unresolved dimension, ask ONE question (with a recommended answer), then validate the reply against code. Keep a visible scorecard each turn, e.g. `Resolved 5/9 — open: Concurrency & timing, Accessibility`.
A dimension closes when it is **answered** or **explicitly waived** (waiver reason recorded; INS safety dimensions require a reason). The gate passes at ~95% = every high-impact dimension closed AND cross-checked. Announce "Confidence gate passed" before Phase 2.

## Phase 2 — Research → use-case inventory
With the resolved understanding, enumerate from the code: real states/transitions, every integration call + its trigger, and data/permission states that change behavior. Produce an exhaustive candidate use-case list, each tagged to one or more of the 9 dimensions. This is the raw material for prioritization — do not cut yet.

## Phase 3 — Risk-score + 80/20 cut
Read `references/risk-scoring.md` and `references/automation-tiers.md`.
- Score each candidate `likelihood × impact × cost-of-failure` → Priority (P1–P3) + Risk label (High/Med/Low).
- Draw the explicit "must-test 20%" line; write a 1-paragraph justification.
- Send below-the-line cases to the "Consciously skipped (why)" appendix with a reason each.
- Tag each kept case with Test Type (unit / integration / e2e / manual-only), stack-aware.

## Phase 4 — Write test cases
Read `references/template.md`. Render kept cases into the 12-column template, layered UI → integration → backend/API → notification, using `Verify after step #N` grouping. Start from `assets/test-plan-template.md`.

## Phase 5 — Output
1. Write `docs/test-plans/<feature-slug>.md` in the app repo (create dir if needed).
2. Offer to sync to Confluence. If the dev accepts, read `references/confluence-format.md` and create/update the page under the epic via the Atlassian MCP. If the MCP is unavailable, say so; the local `.md` still stands.
3. Optional final offer: scaffold automated-test stubs for the unit/integration/e2e cases in the detected framework (declined by default).

## Completion summary
Report: feature, stack, dimensions resolved/waived, total candidates, must-test kept (count), consciously skipped (count), test-type breakdown, output path(s).
