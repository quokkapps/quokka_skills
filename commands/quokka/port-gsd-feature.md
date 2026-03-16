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

# Objective

Analyze completed GSD feature from planning artifacts + source code → generate **platform-agnostic porting document**.

Output describes WHAT the feature does, not HOW to implement on any target platform.

Unlike `/quokka:port-feature` (scans code by description), this reads GSD artifacts (PLAN.md, SUMMARY.md, VERIFICATION.md, etc.) for richer context — then cross-references with actual code.

# Arguments

**Required:** Source reference (first positional arg). Accepts:
- Phase: `.planning/phases/16-intour-nav/` or `phase 16` or `16`
- Milestone: `milestone v1.2` or `v1.2` or `.planning/milestones/v1.2-phases/`
- Quick task: `.planning/quick/2-research-audio/` or `quick 2`
- Debug session: `.planning/debug/review-bottomsheet/`

**Optional:**
- `--output <path>` — output path (default: `.planning/ports/`)

No args → show usage error and exit.

# Process

## 1. Resolve source → planning artifacts

**Phase:** Read `ROADMAP.md` → read all files in `.planning/phases/{dir}/`: `*-PLAN.md`, `*-SUMMARY.md`, `*-VERIFICATION.md`, `*-UAT.md` → read `REQUIREMENTS.md`

**Milestone:** Read milestone roadmap → read ALL phase plans/summaries/verifications → read `REQUIREMENTS.md`

**Quick task:** Read all files in `.planning/quick/{dir}/`

**Debug session:** Read all files in `.planning/debug/{dir}/`

## 2. Detect source platform

| Marker | Platform |
|---|---|
| `build.gradle.kts` / `build.gradle` | Android |
| `*.xcodeproj` / `Package.swift` | iOS |
| `pubspec.yaml` | Flutter |
| `package.json` + react-native | React Native |

Store as `SOURCE_PLATFORM`. Platform notes in output are supplementary only.

## 3. Deep-analyse planning documents

**From PLAN.md:** Objective, requirement IDs, success criteria, interfaces, tasks, verification steps, file modifications

**From SUMMARY.md:** What was accomplished, key decisions + WHY, deviations from plan, patterns, files modified

**From VERIFICATION.md:** Verified truths → become acceptance criteria, requirement satisfaction, anti-patterns

**From UAT.md:** Test scenarios, expected behaviours, edge cases

**From ROADMAP.md:** Phase dependencies, goals, success criteria

## 4. Analyse source code

For each file in plan/summary `files_modified` or `key-files`:

Read each file. Extract in **platform-agnostic terms**. Use Agent (subagent_type: Explore) for deep tracing if many files.

Only categories that exist:
- **State model** — full shape: every field, type, possible values, default. Critical.
- **Data models** — fields, types, nullability, defaults, relationships, enums
- **Business logic** — state machines, calculations, validations, branches, errors. **Pseudocode only.**
- **UI behaviour** — screen purpose, spatial layout (natural language), state→UI, interactions + positions, navigation, animations
- **Network contracts** — endpoints, methods, request/response, auth, retry
- **Persistence** — entities, queries, caching, migrations
- **Analytics** — event names, params + computation, screen tracking
- **External deps** — third-party libs, system APIs

For each: WHAT it does + WHY (from planning docs) + source file ref.

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

## 5. Consolidate requirements

Merge from two sources:

**From planning artifacts:**
- Requirement IDs from REQUIREMENTS.md
- Success criteria from VERIFICATION.md → acceptance criteria
- UAT scenarios

**From code analysis:**
- Behaviours in code but not in planning docs
- Edge cases from tests not in planning docs

**Output:** Each requirement gets:
- ID: `PORT-{NN}`
- Description + acceptance criteria (observable, testable)
- Source evidence (planning artifact + file/function)

Plus non-functional requirements + edge cases.

## 6. Generate porting document

Fill template below. **Omit empty sections entirely.**

### Core principles
- **Platform-agnostic.** WHAT + HOW IT BEHAVES, not how to implement
- **NEVER target-platform guidance.** No arch recommendations, no tech mapping, no file structures, no framework advice
- **Business logic in pseudocode.** Never copy source-language code
- **UI as behaviour.** Spatial descriptions — where buttons are, what user sees per state
- **Source-platform notes = supplementary.** Brief annotations to help research equivalents
- **State model is mandatory.** Analytics/UI/logic all read from state
- **Every value explicit.** Params, units, definitions — no ambiguity
- **Preserve decisions from planning docs.** Key decisions + rationale from SUMMARY.md — explains WHY

### Output Template

```markdown
# Feature Port: {Feature Name}
## Source Platform: {Platform}
## Generated: {date}
## Source Reference: {path to planning artifacts}

---

## Summary
{2-3 paragraphs: end-to-end user experience. How user enters, what they see/do, how they leave.}

---

## Source Files Analysed
{Files grouped by layer: Presentation / Domain / Data / Wiring / Tests}
- `{file}` — {purpose}

---

## Requirements

### Functional
**PORT-01: {Title}**
- Description: {what}
- Acceptance Criteria: {testable statements}
- Source: `{file}:{function}` | `{planning artifact}`

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
| Decision | Rationale | Planning Reference |
|---|---|---|

---

## Migration Checklist
{Auto-generate from sections present in this document.}

---

## Appendix: Source Code Reference
{Short snippets (10-30 lines) that clarify ambiguous pseudocode.}
```

## 7. Write output

- `--output` flag → use that path
- Default: `.planning/ports/{feature-slug}-port-gsd-feature.md`
- Create `.planning/ports/` if needed

## 8. Completion summary

```
Port document generated:
  Feature:      "{name}" (from {GSD artifact type})
  Source:        {platform} ({N} files)
  Document:     {path}
  Requirements:  {N} functional, {N} non-functional
  Test cases:    {N}
  Analytics:     {N} events

Next steps:
  With GSD: /gsd:new-milestone → provide this document as requirements
  Without:  Provide to any AI agent or developer as a spec
```

# Guidelines

## Discovery (GSD-specific)
- Read ALL planning artifacts — don't skip summaries, verifications, UAT
- Read actual source code too — plans = intent, code = reality. Prefer code when they diverge.
- Cross-reference decisions from SUMMARY.md — preserve rationales

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
