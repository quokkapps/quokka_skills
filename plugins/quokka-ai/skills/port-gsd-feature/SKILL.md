---
name: port-gsd-feature
description: "Analyze a completed GSD feature (phase, milestone, quick task) and generate a comprehensive porting document for the target platform. Auto-detects source platform (Android/iOS). Self-contained spec ready for gsd:new-milestone on target repo."
---

<objective>
Analyze a completed feature from GSD planning artifacts and source code, then generate a comprehensive, platform-agnostic porting document. The document captures ALL requirements, business logic, architecture mapping, data models, analytics events, test cases, and edge cases — so a coding agent on the target platform can implement the exact equivalent using GSD commands without needing access to the source platform's codebase.

This command bridges Android (Kotlin/Jetpack Compose) ↔ iOS (Swift/SwiftUI) by extracting WHAT the feature does (not HOW it's implemented) and providing platform-specific implementation guidance for the target.
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
- `--to ios` or `--to android` — Target platform (default: auto-detect opposite of current repo)
- `--output <path>` — Output path for the porting document (default: `.planning/ports/`)

If no arguments provided:
```
ERROR: Source reference required
Usage: /port-gsd-feature <source-ref> [--to ios|android] [--output <path>]

Examples:
  /port-gsd-feature .planning/phases/16-intour-navigation-interactions/
  /port-gsd-feature phase 16
  /port-gsd-feature milestone v1.2
  /port-gsd-feature .planning/quick/2-research-audio-ducking-source/
  /port-gsd-feature quick 2 --to ios
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

<step name="detect_platforms">
**2. Detect source and target platforms**

Examine the current repository to determine the source platform:
- Check for `build.gradle.kts` or `build.gradle` → Android (Kotlin)
- Check for `*.xcodeproj` or `Package.swift` → iOS (Swift)
- Check for `pubspec.yaml` → Flutter
- Check for `package.json` with react-native → React Native

Set target platform:
- If `--to` flag provided, use that
- Otherwise, **always infer the opposite**: Android repo → target is iOS. iOS repo → target is Android. No need for the user to specify `--to` in the common case.

Store: `SOURCE_PLATFORM`, `TARGET_PLATFORM`
</step>

<step name="analyze_planning_docs">
**3. Deep-analyze planning documents**

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
- Expected behaviors
- Edge cases tested

**From ROADMAP.md:**
- Phase dependencies
- Phase goals
- Success criteria summaries
</step>

<step name="analyze_source_code">
**4. Analyze the actual source code implementation**

For each file listed in the plan/summary `files_modified` or `key-files`:

Use Agent tool (subagent_type: Explore) to:
1. Read each modified file
2. Extract the specific changes made for this feature (guided by PLAN.md tasks)
3. Identify:
   - **Data models**: Classes, enums, sealed classes, data classes
   - **Business logic**: State machines, calculations, transformations
   - **UI components**: Screens, composables/views, navigation
   - **API contracts**: Network calls, request/response models
   - **Database schemas**: Entities, DAOs, migrations
   - **Analytics events**: Event names, parameters, components
   - **Dependencies**: Third-party libraries used and their purpose
   - **Architecture patterns**: MVI/MVVM/MVC, DI, repository pattern
   - **Error handling**: Edge cases, error states, fallbacks
   - **State management**: State containers, reducers, stores

For each extracted element, note:
- The WHAT (platform-agnostic behavior)
- The HOW on source platform (implementation detail)
- The WHY (business reason from planning docs)
</step>

<step name="create_architecture_mapping">
**5. Create cross-platform architecture mapping**

Build a mapping table between source and target platform equivalents:

**Android → iOS mapping:**
| Android (Kotlin) | iOS (Swift/SwiftUI) |
|---|---|
| ViewModel (MVI) | ObservableObject / @Observable |
| Jetpack Compose | SwiftUI |
| Koin DI | Swift DI (Environment, factory pattern) |
| Room Database | Core Data / SwiftData |
| Ktor Client | URLSession / Alamofire |
| ExoPlayer (Media3) | AVPlayer / AVFoundation |
| Firebase Analytics | Firebase Analytics (iOS SDK) |
| Navigation Compose | NavigationStack / NavigationPath |
| Coroutines/Flow | async/await, Combine |
| DataStore | UserDefaults / @AppStorage |
| WorkManager | BGTaskScheduler |
| Coil | AsyncImage / Kingfisher |
| Material3 | Native SwiftUI components |

**iOS → Android mapping:** (reverse of above)

Only include mappings relevant to the feature being ported.
</step>

<step name="generate_porting_document">
**6. Generate the comprehensive porting document**

Create the output document with this structure:

```markdown
# Feature Port: {Feature Name}
## Source: {Platform} → Target: {Platform}
## Generated: {date}
## Source Reference: {path to planning artifacts}

---

## Executive Summary
{1-2 paragraph description of what this feature does, why it exists, and what the user experiences}

---

## Requirements

### Functional Requirements
{Each requirement from REQUIREMENTS.md that this feature satisfies, with:}
- **ID**: {REQ-ID}
- **Description**: {What it must do}
- **Acceptance Criteria**: {Observable truths from VERIFICATION.md}
- **Priority**: {Must-have / Nice-to-have}

### Non-Functional Requirements
{Performance, accessibility, offline support, etc.}

---

## Business Logic Specification

### Core Behaviors
{Platform-agnostic description of each behavior:}

#### Behavior 1: {Name}
- **Trigger**: {What causes this behavior}
- **Input**: {What data is needed}
- **Processing**: {Step-by-step logic in pseudocode}
- **Output**: {What happens as a result}
- **Edge Cases**: {Boundary conditions}

### State Machine / Flow
{If the feature has state management, describe the states and transitions:}
- States: {list}
- Transitions: {trigger → from → to}
- Side effects: {what happens on each transition}

### Data Models
{Platform-agnostic model definitions:}
```
Model: {Name}
  - field1: Type (description)
  - field2: Type (description)

Enum: {Name}
  - VALUE_1 (description)
  - VALUE_2 (description)
```

---

## Analytics Specification

{If the feature includes analytics:}

### Events
| Event Name | Component | Action | Parameters | When Fired |
|---|---|---|---|---|
| {name} | {component} | {action} | {param: type} | {trigger} |

### Event Parameters
{Detailed description of each parameter, its type, format, and computation logic}

### Metadata / Enrichment
{Cross-cutting parameters that all events should carry}

---

## API / Network Contracts

{If the feature involves network calls:}
### Endpoint: {name}
- **Method**: GET/POST/etc.
- **URL**: {path}
- **Request**: {model}
- **Response**: {model}
- **Error handling**: {strategy}

---

## Database / Persistence

{If the feature involves local storage:}
### Entity: {name}
- **Fields**: {field definitions}
- **Relationships**: {foreign keys, joins}
- **Indices**: {optimization indices}
- **Migration**: {if schema changes needed}

---

## UI Specification

### Screens
{For each screen/view:}
#### Screen: {Name}
- **Purpose**: {what the user sees/does}
- **Layout**: {description of UI structure}
- **States**: {loading, content, error, empty}
- **Interactions**: {tap, swipe, long-press, etc.}
- **Navigation**: {where it comes from, where it goes}

### Components
{Reusable UI components needed:}
#### Component: {Name}
- **Props/Input**: {what it receives}
- **Appearance**: {visual description}
- **Behavior**: {interaction behavior}

---

## Target Platform Implementation Guide

### Architecture Recommendation
{How to structure this on the target platform:}
- **Pattern**: {MVVM/MVI/TCA/etc.}
- **DI approach**: {how to inject dependencies}
- **State management**: {how to manage state}

### Technology Mapping
| Source ({platform}) | Target ({platform}) | Notes |
|---|---|---|
| {source tech} | {target tech} | {migration notes} |

### Key Implementation Notes
{Platform-specific gotchas, best practices, and recommendations}

### Suggested File Structure
```
{target platform file tree}
```

---

## Test Cases

### Unit Tests
{For each testable behavior:}
#### Test: {Name}
- **Given**: {precondition}
- **When**: {action}
- **Then**: {expected outcome}

### Integration Tests
{Cross-component test scenarios}

### UI Tests
{User-facing test scenarios from UAT.md}

### Manual Test Plan
{Tests that require device/manual verification}
| # | Scenario | Steps | Expected Result |
|---|---|---|---|
| 1 | {name} | {steps} | {expected} |

---

## Dependencies

### Required Libraries
| Library | Purpose | Source Equivalent |
|---|---|---|
| {lib} | {what for} | {what was used on source} |

### Configuration
{Any config files, API keys, feature flags needed}

---

## Migration Checklist

- [ ] Data models created
- [ ] Business logic implemented
- [ ] UI screens built
- [ ] Analytics events wired
- [ ] API integration connected
- [ ] Database schema set up
- [ ] Unit tests written
- [ ] Integration tests passing
- [ ] Manual test plan executed
- [ ] Code review completed

---

## Appendix: Source Implementation Reference

### Key Decisions from Source
{Decisions and their rationale from SUMMARY.md, so the target team understands WHY}

### Known Issues / Workarounds
{Any issues encountered during source implementation that may affect porting}

### Source Files Reference
{List of source files for cross-reference if needed}
```
</step>

<step name="write_output">
**7. Write the porting document**

Determine output path:
- If `--output` provided, use that path
- Otherwise: `.planning/ports/{feature-slug}-{target-platform}-port.md`

Create the `.planning/ports/` directory if it doesn't exist.

Write the generated document.
</step>

<step name="completion">
**8. Present completion summary**

```
Port document generated:
- Source: {source platform} feature "{feature name}"
- Target: {target platform}
- Document: {output path}
- Requirements: {count} functional, {count} non-functional
- Test cases: {count} unit, {count} integration, {count} manual
- Analytics events: {count}

---

## Next Steps

The porting document is ready to use as input for GSD on the target platform:

### Option A: New Milestone (multi-phase feature)
Open the target platform repo and run:
`/gsd:new-milestone` then provide the porting document as requirements

### Option B: Quick Task (small feature)
`/gsd:quick <paste relevant section>`

### Option C: Manual Planning
Use the document as a reference while planning manually

---
```
</step>

</process>

<guidelines>

## Analysis Depth

- **Read ALL planning artifacts** — don't skip summaries, verifications, or UAT docs
- **Read actual source code** — plans describe intent, code shows reality; prefer code truth over plan descriptions when they diverge
- **Extract business logic as pseudocode** — not source-language code
- **Capture edge cases** — these are often the hardest to port and the most important to document
- **Include the WHY** — decisions rationale is critical for the target team to make equivalent architectural choices

## Platform-Agnostic Principle

The porting document should be **80% platform-agnostic** (what the feature does) and **20% target-specific** (how to build it on the target). A developer who has never seen the source codebase should be able to implement the feature from this document alone.

## Quality Criteria

The document is ready when:
1. Every requirement has clear acceptance criteria
2. Every business logic path has pseudocode
3. Every analytics event has full parameter specification
4. Every UI screen has layout and interaction description
5. Every test case has given/when/then
6. Architecture mapping covers all technology choices
7. A coding agent could start `gsd:new-milestone` with this document and produce a working implementation

</guidelines>
