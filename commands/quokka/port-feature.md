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

# Objective

Scan codebase by feature description → reverse-engineer requirements, logic, models, analytics, UI → generate **platform-agnostic porting document**.

Output describes WHAT the feature does, not HOW to implement on any target platform.

# Arguments

**Required:** Feature description (all non-flag args joined)

**Optional:**
- `--scope <path>` — narrow scan to directory
- `--output <path>` — output path (default: `.planning/ports/`)

No args → show usage error and exit.

# Process

## 1. Detect source platform

| Marker | Platform |
|---|---|
| `build.gradle.kts` / `build.gradle` | Android |
| `*.xcodeproj` / `Package.swift` | iOS |
| `pubspec.yaml` | Flutter |
| `package.json` + react-native | React Native |

Store as `SOURCE_PLATFORM`. Platform notes in output are supplementary only.

## 2. Discover feature footprint

**This is the most critical step. A missed file = missed requirement.**

- **Pass 1 — Keyword search:** Extract terms from description → Grep/Glob for class names, domain terms, feature terms
- **Pass 2 — Dependency tracing:** From Pass 1 hits, trace imports, references, DI modules, navigation routes. Use Agent (subagent_type: Explore) for deep tracing if many files.
- **Pass 3 — Categorise:** Group into Presentation / Domain / Data / Wiring / Utilities / Tests
- **Pass 4 — Completeness check:**
  - Test files found? (goldmine for edge cases)
  - DI modules that wire these components?
  - Navigation entries routing to screens?
  - If `--scope` set, traced external deps outside scope?

Confirm file list is complete before proceeding.

## 3. Deep-analyse each file

Read every file. Extract in **platform-agnostic terms** (only categories that exist):

- **State model** — full shape: every field, type, possible values, default. Critical — everything else depends on this.
- **Data models** — fields, types, nullability, defaults, relationships, enums
- **Business logic** — state machines, calculations, validations, branches, errors. Capture as **pseudocode**.
- **UI behaviour** — screen purpose, spatial layout (natural language), state→UI mapping, interactions + positions, navigation, animations
- **Network contracts** — endpoints, methods, request/response shapes, auth, retry
- **Persistence** — entities, queries, caching, migrations
- **Analytics** — event names, params + computation, screen tracking
- **External deps** — third-party libs, system APIs

For each element: **WHAT** it does + **WHY** it exists + source file ref.

### Precision rules

The agent has NO source code access. Every ambiguity = blocker.

- **Enumerate all possible values.** Not "status string" → list "playing", "paused", "idle"
- **Specify units.** ms vs s vs min. px vs pt. Always explicit.
- **Define computed values.** "visited stops ratio" → exact formula + what counts as "visited"
- **Clarify shared event names.** Same event name + different param? Call it out.
- **Flag intentional inversions.** `speakerStatus="off"` when `muteAllAudio="on"`? Explicit.
- **Map UI controls to values.** 3-segment picker Softer/Normal/Louder → 0.5/1.0/1.5
- **Document firing order.** State updated before analytics fires? State as ordering constraint.
- **Resolve naming mismatches.** `logVirtualTourClick` fires `inTourListStopsCta_click`? Clarify.
- **Specify lifecycle timing.** Screen view fires on create? resume? once per session?
- **Define every referenced model.** If pseudocode mentions `place.isStop`, `Data Models` must define `Place` with ALL fields. No dangling references.
- **Capture conditional UI states.** Not just what exists — when is it disabled, dimmed, hidden, non-interactive? Map state → visibility/enabled for every control.
- **Find no-op/early-return paths.** Null checks, empty guards, boundary conditions, permissions missing — these are edge cases. Document what happens when the feature does nothing.

## 4. Reverse-engineer requirements

**Group by behaviour** — each group describes one coherent user-facing capability:
- ID: `PORT-{NN}`
- Description + acceptance criteria (observable, testable)
- Source evidence (file/function)
- Related requirements grouped under the same behaviour heading

**Non-functional:** Performance, accessibility, offline, concurrency, error recovery.

**Edge cases:** Empty states, errors, boundaries, no-op paths. Tests are valuable — they encode explicit developer thinking.

## 5. Generate porting document

Fill template below. **Omit empty sections entirely.**

### Core principles
- **Platform-agnostic.** WHAT + HOW IT BEHAVES, not how to implement
- **NEVER target-platform guidance.** No arch recommendations, no tech mapping, no file structures, no framework advice
- **Business logic in pseudocode.** Never copy source-language code
- **UI as behaviour.** Spatial descriptions — where buttons are, what user sees per state
- **Source-platform notes = supplementary.** Brief annotations to help research equivalents
- **State model is mandatory.** Analytics/UI/logic all read from state
- **Every value explicit.** Params, units, definitions — no ambiguity

### Output Template

```markdown
# Feature Port: {Feature Name}
## Source Platform: {Platform}
## Generated: {date}
## Scanned: "{feature description}"

---

## Summary
{2-3 paragraphs: end-to-end user experience. How user enters, what they see/do, how they leave.}

---

## Source Files Analysed
{Files grouped by layer: Presentation / Domain / Data / Wiring / Tests}
- `{file}` — {purpose}

---

## Requirements

### Functional (grouped by behaviour)

#### {Behaviour Group Name}
**PORT-01: {Title}**
- Description: {what}
- Acceptance Criteria: {testable statements}
- Source: `{file}:{function}`

**PORT-02: {Related Title}**
- ...

### Non-Functional
- **Performance:** {if applicable}
- **Accessibility:** {if applicable}
- **Offline:** {if applicable}
- **Error Recovery:** {if applicable}

### Edge Cases
| Edge Case | Expected Behaviour | Source |
|---|---|---|

---

## Business Logic

### {Behaviour Name}
**Trigger:** {cause}
**Input:** {data needed}
```pseudocode
{logic}
```
**Output:** {result}
**Edge Cases:** {boundaries}

### State Machine
| From | Event | To | Side Effects |
|---|---|---|---|

---

## State Model
### {State Object}
| Field | Type | Possible Values | Default | Description |
|---|---|---|---|---|

---

## Data Models
### {Model Name}
| Field | Type | Required | Default | Notes |
|---|---|---|---|---|

---

## Analytics

### Event Naming Convention
{Pattern + shared-name disambiguation}

### Shared Metadata
{Common payload: field, type, values, computation, units}

### Events Table
| # | Event Name | Trigger | Extra Params | Notes |
|---|---|---|---|---|

### Parameter Keys
| Constant | String Value |
|---|---|

---

## API / Network Contracts
### {Endpoint}
- Method / Path / Auth / Request / Response / Error Handling

---

## Persistence
### {Entity}
- Purpose / Fields / Operations / Caching Strategy

---

## UI Specification
### Screen: {Name}
**Purpose:** {goal}
**Layout:** {spatial description in natural language}
**Visual States:** Loading / Content / Empty / Error
**Interactions:**
| Element | Location | Interaction | Behaviour |
|---|---|---|---|
**Conditional States:**
| Element | Condition | Visual State | Interactive? |
|---|---|---|---|
**Navigation:** Entry / Exit

### Sheets / Dialogs
{Trigger, content, dismiss}

---

## Test Cases
### Unit Tests
- **Given:** / **When:** / **Then:**

### Manual Test Plan
| # | Scenario | Steps | Expected |
|---|---|---|---|

---

## External Dependencies
| Dependency | Purpose | Category |
|---|---|---|

---

## Key Decisions from Source
{Reverse-engineer WHY from comments, naming conventions, and non-obvious logic paths.}
| Decision | Evidence | Rationale |
|---|---|---|

---

## Migration Checklist
{Auto-generate from sections present in this document.}

---

## Appendix: Source Code Reference
{Short snippets (10-30 lines) that clarify ambiguous pseudocode.}
```

## 6. Write output

- `--output` flag → use that path
- Default: `.planning/ports/{feature-slug}-port-feature.md`
- Create `.planning/ports/` if needed

## 7. Completion summary

```
Port document generated:
  Feature:      "{description}"
  Source:        {platform} ({N} files)
  Document:     {path}
  Requirements:  {N} functional, {N} non-functional
  Test cases:    {N}
  Analytics:     {N} events
```

# Guidelines

## Discovery
- Cast wide net first, then narrow
- Don't miss wiring — DI, navigation, manifest entries
- Tests = goldmine of edge cases and requirements
- Read comments — they explain WHY

## Analysis
- Read actual code, don't just grep names
- Follow data flow end-to-end: UI → state → logic → data → API/DB → back
- Extract full state model — without it, pieces don't connect
- Enumerate every value, specify every unit, define every computation
- Capture error handling — graceful failure matters
- Note concurrency patterns — they differ across platforms

## Quality — "Blind Agent" Test

Document is ready when an agent with **zero source access** can:
1. Understand the full user experience
2. Know the complete state shape
3. Implement every behaviour from pseudocode (no ambiguous values/units)
4. Build every screen with spatial element positions
5. Wire all analytics with exact keys and values
6. Write tests for all behaviours and edge cases
7. Choose their own architecture — doc describes WHAT, not HOW

If agent would ask "what are the possible values?" / "where is this button?" / "what unit?" → not done.

## NEVER include
- Target-platform architecture recommendations
- Technology mapping tables
- Suggested file structures for target
- Framework-specific advice
- DI framework recommendations
