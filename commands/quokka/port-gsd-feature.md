---
name: quokka:port-gsd-feature
description: Analyze a completed GSD feature (phase, milestone, quick task) and generate a platform-agnostic porting document. Reads from GSD planning artifacts + source code.
argument-hint: "<source-ref> [--output <path>]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Agent
  - AskUserQuestion
---

<objective>
Analyze a completed feature from GSD planning artifacts and source code, then generate a
**platform-agnostic porting document**.

The output describes WHAT the feature does and HOW it behaves, not how to implement it on any
specific target platform. The destination team or AI agent decides their own architecture,
frameworks, and patterns. This document gives them everything they need to make those decisions
and build a faithful port.

Unlike `/quokka:port-feature` (which scans code by description), this command reads GSD planning
artifacts (PLAN.md, SUMMARY.md, VERIFICATION.md, etc.) for richer context about requirements,
decisions, and acceptance criteria — then cross-references with actual source code.
</objective>

<arguments>
Parse the command arguments:

**Required: Source reference** (first positional argument)
Accepts any of these formats:
- Phase directory: `.planning/phases/16-intour-navigation-interactions/`
- Phase number: `phase 16` or `16`
- Milestone name: `milestone v1.2` or `v1.2`
- Milestone directory: `.planning/milestones/v1.2-phases/`
- Quick task directory: `.planning/quick/2-research-audio-ducking-source/`
- Quick task number: `quick 2`
- Debug session: `.planning/debug/review-bottomsheet-not-showing/`

**Optional flags:**
- `--output <path>` — Output path for the porting document (default: `.planning/ports/`)

If no arguments provided:
```
ERROR: Source reference required
Usage: /quokka:port-gsd-feature <source-ref> [--output <path>]

Examples:
  /quokka:port-gsd-feature .planning/phases/16-intour-navigation-interactions/
  /quokka:port-gsd-feature phase 16
  /quokka:port-gsd-feature milestone v1.2
  /quokka:port-gsd-feature .planning/quick/2-research-audio-ducking-source/
  /quokka:port-gsd-feature quick 2
```
Exit.
</arguments>

<process>

<step name="resolve_source">
**1. Resolve the source reference to planning artifacts**

Based on the argument format, locate all relevant files:

**For a phase:**
- Read `.planning/ROADMAP.md` to find the phase entry
- Read all files in `.planning/phases/{phase-dir}/`:
  - `*-PLAN.md` — Implementation plan with tasks, interfaces, and requirements
  - `*-SUMMARY.md` — What was actually built, decisions made, deviations
  - `*-VERIFICATION.md` — Verification report with truth assertions
  - `*-UAT.md` — User acceptance test cases (if exists)
- Read `.planning/REQUIREMENTS.md` for requirement definitions referenced by the phase

**For a milestone:**
- Read the milestone roadmap (e.g., `.planning/milestones/v1.2-ROADMAP.md`)
- Read ALL phase plans, summaries, and verifications within the milestone
- Read `.planning/REQUIREMENTS.md`

**For a quick task:**
- Read all files in `.planning/quick/{task-dir}/`

**For a debug session:**
- Read all files in `.planning/debug/{session-dir}/`

Collect all artifact paths into a list for processing.
</step>

<step name="detect_source_platform">
**2. Detect source platform**

Examine the current repository for platform markers:

| Marker | Platform |
|---|---|
| `build.gradle.kts` / `build.gradle` | Android (Kotlin) |
| `*.xcodeproj` / `Package.swift` / `*.xcworkspace` | iOS (Swift) |
| `pubspec.yaml` | Flutter (Dart) |
| `package.json` with react-native | React Native |

Store `SOURCE_PLATFORM` for context in the output document. The porting document itself is
platform-agnostic — source-platform notes appear only as supplementary annotations where they
help clarify an otherwise ambiguous behaviour.
</step>

<step name="analyze_planning_docs">
**3. Deep-analyse planning documents**

Read every collected artifact and extract:

**From PLAN.md files:**
- Phase/task objective and purpose
- Requirements IDs and descriptions
- Success criteria (observable truths)
- Interface definitions (types, contracts, APIs)
- Task breakdown with actions
- Verification steps
- File modifications and their purposes

**From SUMMARY.md files:**
- What was actually accomplished
- Key decisions made and WHY
- Deviations from plan
- Patterns established
- Files created/modified

**From VERIFICATION.md files:**
- All verified truths (these become the target's acceptance criteria)
- Requirement satisfaction evidence
- Anti-patterns to avoid

**From UAT.md files (if present):**
- Manual test scenarios
- Expected behaviours
- Edge cases tested

**From ROADMAP.md:**
- Phase dependencies
- Phase goals
- Success criteria summaries
</step>

<step name="analyze_source_code">
**4. Analyse the actual source code implementation**

For each file listed in the plan/summary `files_modified` or `key-files`:

Use Agent tool (subagent_type: Explore) to read each modified file and extract what it does
in **platform-agnostic terms**.

Only extract categories that are present — not every file will have all of these:

- **State model** — the full shape of the state object(s) the feature reads and writes. This is
  critical context that downstream logic, analytics, and UI all depend on. List every field,
  its type, its possible values, and its default.
- **Data models & types** — fields, types, nullability, defaults, relationships, enums, constants
- **Business logic** — state machines, calculations, validations, conditional branches, error
  handling, side effects. Capture as **pseudocode**, not source-language code.
- **UI behaviour** — screen purpose, conceptual layout structure (described in natural language),
  what state drives what UI, user interactions and where they sit on screen, navigation
  entry/exit points, animations
- **Network contracts** — endpoints, methods, request/response shapes, auth, error/retry strategy
- **Persistence** — entities, queries, caching strategy, migrations
- **Analytics** — event names, parameters and how they're computed, screen tracking, enrichment
- **External dependencies** — third-party libraries, system APIs (camera, GPS, audio, etc.)

For each element, capture:
- The WHAT (platform-agnostic behaviour)
- The WHY (business reason from planning docs)
- Source file reference (so the reader can verify)

**Precision rules — the agent reading this document has no access to the source code, so
every ambiguity becomes a blocker:**

- **Enumerate all possible values.** If a field can be "playing", "paused", or "idle" — list
  all three. Don't say "status string" and leave the agent guessing.
- **Specify units.** Milliseconds vs seconds vs minutes. Pixels vs points. Always explicit.
- **Define computed values.** If a value like "visited stops ratio" is computed, explain the
  exact computation and what counts as "visited" (arrival event? proximity? manual action?).
- **Clarify shared event names.** If multiple distinct actions share the same event name
  (disambiguated by a parameter), call this out explicitly so the agent understands the
  dispatch pattern.
</step>

<step name="reverse_engineer_requirements">
**5. Consolidate requirements**

Merge requirements from two sources — planning docs and actual code:

**From planning artifacts:**
- Requirements IDs from REQUIREMENTS.md
- Success criteria from VERIFICATION.md (these become acceptance criteria)
- UAT scenarios

**From code analysis:**
- Any behaviours implemented in code but not documented in planning artifacts
- Edge cases found in tests but not in planning docs

**Output format** — each requirement gets:
- ID: `PORT-{NN}` (sequential)
- Description of what the feature must do
- Acceptance criteria (observable, testable statements)
- Source evidence (planning artifact + file/function)

**Non-functional requirements** — performance constraints, accessibility needs, offline
behaviour, concurrency expectations, error recovery.

**Edge cases** — empty states, error states, boundary conditions. Planning UAT docs and
existing tests are both valuable sources here.
</step>

<step name="generate_porting_document">
**6. Generate the porting document**

Fill in the template below. **Only include sections that are relevant** to the feature being
ported. If a section would be empty, omit it entirely.

Key principles:
- **Platform-agnostic by default.** Describe WHAT and HOW IT BEHAVES, not how to implement it.
- **NEVER include target-platform implementation guidance.** No architecture recommendations,
  no technology mapping tables, no suggested file structures, no framework-specific advice.
  The destination project has its own architecture that this document knows nothing about.
  The agent will decide how to implement — this document tells them what to implement.
- **Business logic in pseudocode.** Never copy source-language code into the spec body.
  Translate all logic into clear, language-neutral pseudocode.
- **UI as behaviour, not layout code.** Describe the screen in natural language: where buttons
  are, what the user sees in each state, what interactions are available and where they sit
  spatially. An agent wiring analytics needs to know "the recenter button is on the map
  overlay toolbar" — not just that a recenter click event exists.
- **Source-platform notes are supplementary.** Brief annotations about source implementation
  (e.g., "uses ExoPlayer with audio ducking via AudioFocus") help the reader research
  equivalents, but they're not prescriptions.
- **State model is mandatory.** The feature's state shape must be fully documented. Analytics,
  UI, and business logic all read from state — without the state model definition, the agent
  can't understand how the pieces connect.
- **Every value must be explicit.** If a parameter can be "on" or "off", say so. If a duration
  is in milliseconds, say so. If "visited" means "user arrived within GPS radius", say so.
  The agent has no source code to check — ambiguity means guessing.
- **Preserve decisions from planning docs.** Include key architectural decisions and their
  rationale from SUMMARY.md — these explain WHY, which helps the target team make equivalent
  choices.

---

### Output Template

```markdown
# Feature Port: {Feature Name}
## Source Platform: {Platform}
## Generated: {date}
## Source Reference: {path to planning artifacts}

---

## Summary

{2-3 paragraphs describing what this feature does from a user's perspective. Walk through the
end-to-end user experience: how the user enters the feature, what they see, what they can do,
and how they leave. Someone reading only this section should be able to picture the feature
in their head — screens, interactions, and purpose. Don't just name the feature; describe the
experience.}

---

## Source Files Analysed

{Complete list of source files grouped by architectural layer. For traceability — so the
destination team can refer back to the original code if needed.}

### Presentation
- `{file}` — {one-line purpose}

### Domain / Business Logic
- `{file}` — {one-line purpose}

### Data
- `{file}` — {one-line purpose}

### Wiring / DI
- `{file}` — {one-line purpose}

### Tests
- `{file}` — {one-line purpose}

---

## Requirements

### Functional Requirements

{The "contract" — the destination implementation must satisfy all of these.}

**PORT-01: {Short title}**
- Description: {What the feature must do}
- Acceptance Criteria:
  - {Observable, testable statement}
- Source Evidence: `{file}:{function/class}` | `{planning artifact}`

**PORT-02: {Short title}**
...

### Non-Functional Requirements

{Only include categories that apply.}

- **Performance:** {Timeouts, lazy loading, caching expectations}
- **Accessibility:** {Content descriptions, focus order, dynamic type support}
- **Offline Behaviour:** {What works offline, what degrades, what fails}
- **Error Recovery:** {Retry policies, fallback states, graceful degradation}

### Edge Cases

| Edge Case | Expected Behaviour | Source Evidence |
|---|---|---|
| {condition} | {what should happen} | `{file}:{location}` or `{UAT scenario}` |

---

## Business Logic

{The heart of the document. Every behaviour described in platform-agnostic pseudocode.}

### {Behaviour Name}

**Trigger:** {What causes this — user action, timer, lifecycle event, etc.}
**Input:** {What data is needed}

**Logic:**
```pseudocode
{Step-by-step logic in plain pseudocode. Include branching, error handling, side effects.}
```

**Output:** {Result — state change, UI update, analytics event, etc.}
**Edge Cases:** {Boundary conditions specific to this behaviour}

### State Machine

{Include only if the feature has meaningful state transitions.}

| From | Event | To | Side Effects |
|---|---|---|---|
| {state} | {event} | {state} | {what happens} |

---

## State Model

{The feature's state shape. This is the connective tissue — business logic writes it, UI reads
it, analytics snapshot it. Without this, the agent can't understand how pieces connect.}

### {State Object Name}
| Field | Type | Possible Values | Default | Description |
|---|---|---|---|---|
| {name} | {type} | {enumerate ALL values, or "any {type}"} | {default} | {what it represents} |

{If state is composed of sub-objects, document each one the same way. If a field is a reference
to another model, note that and define the referenced model in Data Models below.}

---

## Data Models

{Platform-agnostic model definitions with pseudocode types. These are the data structures the
feature operates on — API responses, database entities, domain objects.}

### {Model Name}
| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| {name} | {type} | {yes/no} | {default or —} | {description, including units if numeric} |

**Relationships:** {How this model relates to others}

---

## Analytics

{Include only if the feature fires analytics events.}

### Event Naming Convention
{Explain how event names are constructed — e.g., "{component}_{action}" — so the agent
understands the pattern, not just the list.}

{If multiple distinct actions share the same event name (disambiguated by a parameter), call
this out explicitly: "Events X, Y, Z all fire as `sameEventName` — distinguished by the
`action` parameter value."}

### Shared Metadata
{If events share a common metadata payload, define it once here with every field, its type,
its possible values, its computation logic, and its units. Don't just list field names — the
agent needs to know HOW to compute each value from the state model above.}

### Events Table

| # | Event Name | Trigger | Extra Params (beyond shared metadata) | Notes |
|---|---|---|---|---|
| {n} | {name} | {when fired} | {param: type (possible values) — description} | {disambiguation notes if event name is shared} |

### Parameter Keys
{Exact string keys to use in the analytics payload — the agent must use these verbatim.}

| Constant | String Value |
|---|---|
| {KEY_NAME} | {`"exact_string"`} |

---

## API / Network Contracts

{Include only if the feature makes network calls.}

### {Endpoint Name}
- **Method:** {GET/POST/PUT/DELETE}
- **Path:** {URL path}
- **Authentication:** {What auth is required}
- **Request:** {body model in pseudocode, if applicable}
- **Response:** {body model in pseudocode}
- **Error Handling:** {What happens on 4xx, 5xx, timeout, no network}

---

## Persistence

{Include only if the feature uses local storage or caching.}

### {Entity / Store Name}
**Purpose:** {What data is persisted and why}

| Field | Type | Notes |
|---|---|---|
| {name} | {type} | {indexed? constraints?} |

**Operations:** {CRUD operations in plain language}
**Caching Strategy:** {TTL, invalidation triggers, offline-first behaviour}

---

## UI Specification

{Describe what the user sees and does — product spec, not implementation guide. This section
is essential even for features like analytics, because the agent needs to know WHERE each
interaction happens on screen to wire events correctly.}

### Screen: {Name}

**Purpose:** {What the user accomplishes here}

**Layout (conceptual):**
{Describe the visual structure in natural language, with spatial relationships. Where are the
controls? What's the visual hierarchy? Example: "A full-screen map with a bottom sheet. The
bottom sheet header shows current stop name and a play/pause button. The map overlay has a
toolbar in the top-right with recenter and overview buttons. A speaker button sits in the
top-left corner." — enough detail that the agent knows where every interactive element lives.}

**Visual States:**
- **Loading:** {What the user sees while data loads}
- **Content:** {The normal/populated state}
- **Empty:** {What shows when there's no data}
- **Error:** {What shows when something fails}

**User Interactions:**
| Element | Location | Interaction | Behaviour |
|---|---|---|---|
| {button/control name} | {where on screen} | {tap/swipe/etc.} | {what happens, including analytics event if any} |

**Navigation:**
- **Entry:** {How the user gets here}
- **Exit:** {Where the user can go from here}

### Sheets / Dialogs
{Include any bottom sheets, modals, or overlays the feature uses. Same format as screens
but note what triggers them and how they're dismissed.}

---

## Test Cases

### Unit / Logic Tests

**{Test Name}**
- **Given:** {Precondition}
- **When:** {Action}
- **Then:** {Expected outcome}

### Manual Test Plan

| # | Scenario | Steps | Expected Result |
|---|---|---|---|
| 1 | {name} | {steps} | {expected} |

---

## External Dependencies

{Libraries and system APIs the feature relies on, so the destination team can find equivalents.}

| Dependency | Purpose | Category |
|---|---|---|
| {library or system API} | {what it's used for} | {networking/media/maps/analytics/etc.} |

**Source-platform notes:** {Brief notes on how these are used in the source to help research equivalents.}

---

## Key Decisions from Source

{Decisions and their rationale from SUMMARY.md, so the target team understands WHY certain
approaches were chosen. These inform — but don't prescribe — the target implementation.}

| Decision | Rationale | Planning Reference |
|---|---|---|
| {what was decided} | {why} | `{SUMMARY.md or PLAN.md reference}` |

---

## Migration Checklist

{Auto-generate from sections above. Only include items for sections that exist in this document.}

- [ ] State model defined
- [ ] Data models created
- [ ] Business logic implemented (all PORT-xx requirements)
- [ ] UI screens built (all states: loading, content, empty, error)
- [ ] Analytics events wired
- [ ] API integration connected
- [ ] Persistence layer set up
- [ ] Accessibility verified
- [ ] Offline behaviour tested
- [ ] Unit tests written
- [ ] Manual test plan executed
- [ ] Edge cases verified

---

## Appendix: Source Code Reference

{Short, representative source snippets (10-30 lines each) that clarify intent when pseudocode
alone might be ambiguous. Keep focused and brief.}

### {Snippet Title}
**File:** `{path}`
**Why included:** {What this snippet clarifies}
```{language}
{code}
```
```

---
</step>

<step name="write_output">
**7. Write the porting document**

Output path:
- If `--output` provided, use that
- Otherwise: `.planning/ports/{feature-slug}-port.md`

Create `.planning/ports/` directory if it doesn't exist.
</step>

<step name="completion">
**8. Present completion summary**

```
Port document generated:
  Feature:      "{feature name}" (from {GSD artifact type})
  Source:        {source platform} ({N} files analysed)
  Document:     {output path}
  Requirements:  {count} functional, {count} non-functional
  Test cases:    {count}
  Analytics:     {count} events (or "none")

Next steps:
  Hand this document to a developer or AI coding agent on the destination
  platform. It contains everything needed to implement the feature without
  reading the original source code.

  With GSD: /gsd:new-milestone → provide this document as requirements
  Without:  Provide to any AI agent or developer as a spec
```
</step>

</process>

<guidelines>

## Discovery (GSD-specific)
- **Read ALL planning artifacts** — don't skip summaries, verifications, or UAT docs.
- **Read actual source code too** — plans describe intent, code shows reality. Prefer code
  truth over plan descriptions when they diverge.
- **Cross-reference decisions.** SUMMARY.md often explains WHY things were built a certain
  way — preserve these rationales for the target team.

## Analysis
- Read the actual code, don't just grep for function names.
- Follow data flow end-to-end: UI → state management → business logic → data layer → API/DB
  and back.
- **Extract the full state model.** Analytics, UI, and business logic all read from state.
  If you don't document the state shape, the agent can't understand how the pieces connect.
- **Enumerate every possible value.** Don't write "status: String" — write
  "status: String — one of 'playing', 'paused', 'idle'". The agent has no source to check.
- **Specify every unit.** Milliseconds, seconds, minutes, pixels, points. Always explicit.
- **Define every computation.** If a value is derived (like "visited stops ratio"), explain
  exactly how it's computed and what triggers each state (e.g., "a stop counts as visited
  when the arrival event fires, not on proximity alone").
- Capture error handling — how the feature fails gracefully is as important as the happy path.
- Note concurrency patterns (async/threading) — these often differ significantly between
  platforms and are easy to miss.

## Output Quality — The "Blind Agent" Test
The document is ready when an AI coding agent with **zero access to the source codebase** can:
1. Understand exactly what the feature does and what the user experiences
2. Know the full state shape the feature manages
3. Implement every behaviour from pseudocode alone, with no ambiguous values or units
4. Build every screen knowing where each interactive element sits spatially
5. Wire up all analytics events with exact parameter keys and values
6. Write tests for every behaviour and edge case
7. Choose their own architecture — because the document describes WHAT, not HOW

If the agent would need to ask "what are the possible values of X?" or "where is this button
on screen?" or "what unit is this duration in?" — the document is not done yet.

## What to NEVER include
- No target-platform architecture recommendations
- No technology mapping tables (Android tech → iOS tech)
- No suggested file structures for the target
- No framework-specific advice (no "use @Observable" or "use Combine")
- No DI framework recommendations

These belong to the destination project, not this document.

</guidelines>
</output>
