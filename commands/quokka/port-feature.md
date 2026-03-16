---
name: quokka:port-feature
description: Scan source code by feature description and generate a platform-agnostic porting document. Works purely from code analysis — no planning artifacts needed.
argument-hint: "<feature description> [--scope <path>] [--output <path>]"
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
Scan the current codebase by a natural-language feature description, reverse-engineer the feature's
requirements, business logic, data models, analytics, UI behaviour, and tests — then generate a
**platform-agnostic porting document**.

The output describes WHAT the feature does and HOW it behaves, not how to implement it on any
specific target platform. The destination team or AI agent decides their own architecture,
frameworks, and patterns. This document gives them everything they need to make those decisions
and build a faithful port.
</objective>

<arguments>
Parse the command arguments:

**Required: Feature description** (all non-flag arguments joined)
A natural-language description of what to scan for.

Examples:
- `analytics for InTour screen`
- `audio playback and ducking during tour navigation`
- `offline tour download and caching`
- `user authentication flow`
- `map navigation with turn-by-turn directions`

**Optional flags:**
- `--scope <path>` — Narrow the scan to a specific directory
- `--output <path>` — Output path for the porting document (default: `.planning/ports/`)

If no arguments provided:
```
ERROR: Feature description required
Usage: /quokka:port-feature <feature description> [--scope <path>] [--output <path>]

Examples:
  /quokka:port-feature analytics for InTour screen
  /quokka:port-feature audio playback during tour navigation
  /quokka:port-feature offline tour download --scope app/src/main/java/.../feature/download/
```
Exit.
</arguments>

<process>

<step name="detect_source_platform">
**1. Detect source platform**

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

<step name="discover_feature_scope">
**2. Discover the feature's code footprint**

This is the most critical step. A missed file means a missed requirement. Be thorough.

**Pass 1 — Keyword search:**
Extract key terms from the feature description and search for them:
- Class/file names (e.g., "InTour" → `*InTour*`, `*intour*`)
- Domain terms (e.g., "analytics" → `Analytics`, `logEvent`, `trackScreen`)
- Feature terms (e.g., "audio playback" → `ExoPlayer`, `MediaPlayer`, `AVPlayer`, `AudioSession`)

Use Grep and Glob to find matching files.

**Pass 2 — Dependency tracing:**
From Pass 1 hits, trace connected code:
- What classes/interfaces do they import?
- What classes reference them?
- What DI modules wire them?
- What navigation routes lead to them?

Use Agent (subagent_type: Explore) for deep tracing if the feature spans many files.

**Pass 3 — Layer categorisation:**
Group discovered files into:
- **Presentation**: Screens, ViewModels/Controllers, UI components, navigation
- **Domain / Business Logic**: Use cases, business rules, domain models
- **Data**: Repositories, API clients, database entities, DAOs
- **Wiring / DI**: Dependency injection modules, factories
- **Utilities**: Helpers, extensions, constants
- **Tests**: Unit tests, integration tests

**Pass 4 — Completeness check:**
Before proceeding, verify:
- Are there test files? (They're a goldmine of edge cases and requirements.)
- Are there DI modules that wire these components?
- Are there navigation entries routing to these screens?
- If `--scope` was set, did you trace external dependencies outside that scope?

Confirm the file list is complete before moving on.
</step>

<step name="deep_analyse">
**3. Deep-analyse each discovered file**

Read every file in the footprint. For each, extract what it does in **platform-agnostic terms**.

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
- **WHAT** it does (platform-agnostic behaviour)
- **WHY** it exists (inferred from context, comments, naming)
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
- **Flag intentional inversions.** If two fields represent the same concept with inverted
  semantics (e.g., `speakerStatus = "off"` when `muteAllAudio = "on"`), call this out
  explicitly so the agent doesn't "fix" what looks like a bug.
- **Map discrete UI controls to parameter values.** If a UI control (e.g., a 3-segment
  volume picker: Softer/Normal/Louder) maps to a numeric parameter, document the exact
  mapping (e.g., Softer=0.5, Normal=1.0, Louder=1.5). Don't leave the agent guessing.
- **Document event firing order when it matters.** If state must be updated before analytics
  fires (so the metadata snapshot reflects the new state), state this as an ordering
  constraint in the business logic, not buried in a test case.
- **Resolve naming mismatches.** If a function name doesn't match the component/action it
  fires (e.g., `logVirtualTourClick` fires `inTourListSTopsCta_click`), clarify what the
  function actually does vs what the event name suggests.
- **Specify lifecycle timing.** For screen view events, state exactly when they fire
  (on screen create, on resume, once per session, etc.).
</step>

<step name="reverse_engineer_requirements">
**4. Reverse-engineer requirements from code**

From the analysed code, derive:

**Functional requirements** — each distinct behaviour gets:
- ID: `PORT-{NN}` (sequential)
- Description of what the feature must do
- Acceptance criteria (observable, testable statements)
- Source evidence (which file/function proves this requirement exists)

**Non-functional requirements** — performance constraints, accessibility needs, offline
behaviour, concurrency expectations, error recovery.

**Edge cases** — empty states, error states, boundary conditions (max items, long text,
slow network, no permissions). Existing tests are particularly valuable here — they often
encode edge cases the developer explicitly thought about.
</step>

<step name="generate_porting_document">
**5. Generate the porting document**

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

---

### Output Template

```markdown
# Feature Port: {Feature Name}
## Source Platform: {Platform}
## Generated: {date}
## Scanned: "{feature description}"

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
- Source Evidence: `{file}:{function/class}`

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
| {condition} | {what should happen} | `{file}:{location}` |

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
**6. Write the porting document**

Output path:
- If `--output` provided, use that
- Otherwise: `.planning/ports/{feature-slug}-port-feature.md`

Create `.planning/ports/` directory if it doesn't exist.
</step>

<step name="completion">
**7. Present completion summary**

```
Port document generated:
  Feature:      "{feature description}"
  Source:        {source platform} ({N} files analysed)
  Document:     {output path}
  Requirements:  {count} functional, {count} non-functional
  Test cases:    {count}
  Analytics:     {count} events (or "none")

Next steps:
  Hand this document to a developer or AI coding agent on the destination
  platform. It contains everything needed to implement the feature without
  reading the original source code.
```
</step>

</process>

<guidelines>

## Discovery
- Cast a wide net first, then narrow. Search broadly by keywords, then trace dependencies.
- Don't miss the wiring — DI modules, navigation graphs, manifest entries are easy to forget
  but critical for completeness.
- Existing tests are a goldmine — they encode requirements and edge cases the developer
  explicitly thought about. Read them carefully.
- Read comments and documentation strings — they explain WHY things exist.

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
