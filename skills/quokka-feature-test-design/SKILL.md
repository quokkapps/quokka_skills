---
name: quokka-feature-test-design
description: Use before building a feature in a mobile native or Kotlin Multiplatform app (Android and/or iOS) when you need the full set of test cases and, above all, which few are the must-test 20%. Triggers — "test cases for this feature", "test plan", "before I build X", "/quokka:feature-test-design". For Android / iOS / KMP repos.
---

# Feature Test Design (mobile native + KMP)

Before any code: interview the dev to clarity, list the real use cases from the code, then mark the **Must-Test 20%** — the ~20% of cases that catch ~80% of the risk. The dev executes the Must-Test set by hand and/or covers it with automated tests. Stacks: Android (Kotlin/Compose), iOS (Swift/SwiftUI), shared KMP. You run inside the app repo, so check every claim against real code.

## Rules
- **Don't write the plan until the interview is clear** — every checklist item below resolved or explicitly waived.
- **One question at a time**, with a recommended answer. Verify answers against the code.
- **The Must-Test 20% comes first and is unmistakable** — its own section, dev checks each off. Never bury it in a big list.
- **Never silently drop a case** — non-must-test cases are either automated or listed under "consciously skipped (why)".
- INS safety paths (failure, integration, timing/escalation) are always Must-Test; waiving one needs a recorded reason.

## 1. Orient
Detect the module(s): Android (`build.gradle.kts`), iOS (`*.xcodeproj` / `Package.swift`), KMP (`kotlin { }` multiplatform with `commonMain`). Find the feature in code — entry points, backend calls, navigation, and what is shared (`commonMain`) vs platform-specific (`expect/actual`, native UI). Confirm a 3-bullet summary with the dev. Ask only for what's missing: feature name, ticket/epic key (e.g. `MA-2236`), design link.

## 2. Interview to clarity
Walk this checklist. For each open item ask ONE question, recommend an answer, verify against code. Show `Resolved N/9 — open: …` each turn.

1. **Happy path** — the core success flow
2. **Edge / empty / boundary** — first run, empty, max, last item
3. **Error & failure** — no network, server error, timeout, retry
4. **Integration** — backend calls, notifications, persistence: which fire, when
5. **Data & permission** — role, feature flag, auth/account state
6. **Concurrency & timing** — double-tap, races, schedules/escalation ladders
7. **Platform differences** — Android vs iOS, OS versions, offline
8. **Accessibility** — status not by colour alone; TalkBack / VoiceOver labels
9. **Non-functional** — perf budget, security, resume after process death

An item closes when answered or explicitly waived (reason recorded). INS safety items (3, 4, 6) need a reason to waive.

## 3. Score and pick the Must-Test 20%
List every use case from the code, then score each `likelihood × impact × cost-of-failure` (each 1–3, product 1–27).

**Calibrate so the vital few stay few** — if you mark almost everything High, the 20% is meaningless:
- `impact`/`cost` = 3 only for real harm: lockout, data loss, money, safety, or a silent wrong result. A rule that merely blocks submit, a cosmetic glitch, or a rare-device case is Med/Low.
- Collapse *variations* of one rule into ONE Must-Test case; the other variants are Extended/automated (e.g. empty vs short vs bad-format password = one must-test + the rest automated unit cases).

- **Must-Test (the 20%)** = the load-bearing minority: the happy path, each distinct user-visible failure branch (not trivial variants), the risky race/timing paths, and every stated acceptance criterion. **Risk wins over the quota** (never drop a high-risk case to hit 20%, never pad). If the set exceeds ~30% of all cases, re-score — you're usually over-rating impact or keeping variants; if re-scoring confirms they're genuinely distinct user-visible branches, say so in the "why these are the must-test" line and proceed.
- **Extended** = the rest: automate where cheap, otherwise **consciously skip** with a one-line reason.

Tag each Must-Test case with how the dev covers it: `manual` (dev runs it) and/or an automated tier — see `references/automation-tiers.md` (Android / iOS / KMP).

## 4. Write the plan
Use `references/template.md` (start from `assets/test-plan-template.md`). Two clearly separated sections:

- **▶ MUST-TEST 20% — execute these** (P0 table; each row ends in a `Done (Dev / QA)` cell — two checkboxes, `Dev ☐` and `QA ☐`)
- **Extended coverage** (automate / skip table) + a short "consciously skipped (why)" list.

Write to `docs/test-plans/<feature-slug>.md` (create the dir if needed). Optionally sync to Confluence — read `references/confluence-format.md`; the local `.md` is the source of truth.

## Done
Report: feature, stack(s), checklist resolved/waived, total cases, **Must-Test count**, extended/automated count, skipped count, output path.
