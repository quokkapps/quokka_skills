---
description: Scan source code by feature description (no GSD artifacts needed) and generate a comprehensive porting document for the target platform. Auto-detects source platform (Android→iOS or iOS→Android). Use when porting features that were NOT built with GSD.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, AskUserQuestion
---

<objective>
Scan the current codebase by a natural-language feature description, reverse-engineer the feature's requirements, business logic, data models, analytics, UI, and tests — then generate a comprehensive porting document for the target platform. The output is a self-contained spec that any AI coding agent can use to build the exact equivalent on the target platform.

Unlike `/port-gsd-feature` (which reads GSD planning artifacts), this command works purely from source code analysis. It's for features that were built without GSD, or for codebases that don't use GSD at all.
</objective>

<arguments>
Parse the command arguments:

**Required: Feature description** (all non-flag arguments joined)
A natural-language description of what to scan for.

Examples:
- `analytics for InTour screen`
- `audio playback and ducking during tour navigation`
- `offline tour download and caching`
- `QR code scanning and tour activation`
- `user authentication flow`
- `map navigation with turn-by-turn directions`

**Optional flags:**
- `--to ios` or `--to android` — Target platform. Default: auto-detect opposite of current repo (Android repo → iOS, iOS repo → Android)
- `--output <path>` — Output path for the porting document (default: `.planning/ports/`)
- `--scope <path>` — Narrow the scan to a specific directory (e.g., `--scope app/src/main/java/com/vata/quokkaguide/presentation/feature/intour/`)

If no arguments provided:
```
ERROR: Feature description required
Usage: /port-feature <feature description> [--to ios|android] [--output <path>] [--scope <path>]

Examples:
  /port-feature analytics for InTour screen
  /port-feature audio playback during tour navigation
  /port-feature offline tour download --to ios
  /port-feature QR code scanning --scope app/src/main/java/.../feature/qr/
```
Exit.
</arguments>

<process>

<step name="detect_platforms">
**1. Detect source and target platforms**

Examine the current repository:
- `build.gradle.kts` or `build.gradle` → Android (Kotlin)
- `*.xcodeproj` or `Package.swift` or `*.xcworkspace` → iOS (Swift)
- `pubspec.yaml` → Flutter
- `package.json` with react-native → React Native

Target platform:
- If `--to` flag provided, use that
- Otherwise, **always infer the opposite**: Android repo → iOS. iOS repo → Android.

Store: `SOURCE_PLATFORM`, `TARGET_PLATFORM`
</step>

<step name="discover_feature_scope">
**2. Discover the feature's code footprint**

Use the feature description to find all relevant source files. This is the critical discovery step — be thorough.

**Strategy: Multi-pass search**

**Pass 1: Keyword search**
Extract key terms from the feature description and search for them:
- Class/file names (e.g., "InTour" → `*InTour*`, `*intour*`)
- Domain terms (e.g., "analytics" → `Analytics`, `logEvent`, `trackScreen`)
- Feature terms (e.g., "audio playback" → `ExoPlayer`, `MediaPlayer`, `AudioManager`)

Use Grep and Glob to find matching files.

**Pass 2: Dependency tracing**
From the files found in Pass 1, trace dependencies:
- What classes/interfaces do they import?
- What classes reference them?
- What DI modules wire them?
- What navigation routes lead to them?

Use Agent (subagent_type: Explore) for deep tracing if the feature spans many files.

**Pass 3: Layer identification**
Categorize discovered files by architectural layer:
- **Presentation**: Screens, ViewModels, UI components, navigation
- **Domain**: Use cases, business logic, domain models
- **Data**: Repositories, API clients, database entities, DAOs
- **DI**: Dependency injection modules
- **Utilities**: Helpers, extensions, constants
- **Tests**: Unit tests, integration tests

**Pass 4: Boundary verification**
If `--scope` was provided, limit to that directory but still trace external dependencies.
If not provided, verify you haven't missed files by checking:
- Are there test files for the feature?
- Are there DI modules that wire these components?
- Are there navigation entries that route to these screens?

Present the discovered file list to yourself and verify completeness before proceeding.
</step>

<step name="analyze_source_code">
**3. Deep-analyze each discovered file**

For each file in the feature footprint, read it and extract:

**Data Models & Types:**
- Classes, data classes, enums, sealed classes/interfaces
- Type aliases, constants
- Field types, nullability, default values
- Relationships between models

**Business Logic:**
- State machines and state transitions
- Calculations, transformations, validations
- Conditional logic and branching
- Error handling and recovery
- Side effects (analytics, logging, notifications)

**UI Components:**
- Screen structure and layout hierarchy
- Component composition
- State bindings (what UI reacts to what state)
- User interactions (click, swipe, long-press, scroll)
- Navigation (how user gets here, where they go next)
- Animations and transitions

**API / Network:**
- Endpoints called
- Request/response models
- Authentication requirements
- Error handling (retry, fallback, offline)

**Database / Persistence:**
- Entities and schemas
- Queries (CRUD operations)
- Migrations
- Caching strategy

**Analytics:**
- Event names and when they fire
- Event parameters and their computation
- Screen tracking
- Metadata/enrichment patterns

**Dependencies:**
- Third-party libraries used
- System APIs used (camera, GPS, audio, etc.)
- Internal shared utilities

For each element, extract:
- **WHAT** it does (platform-agnostic behavior)
- **WHY** it exists (infer from context, comments, naming)
- **HOW** it works on source platform (implementation detail for reference)
</step>

<step name="reverse_engineer_requirements">
**4. Reverse-engineer requirements from code**

From the analyzed code, derive:

**Functional Requirements:**
For each distinct behavior, create a requirement:
- ID: `PORT-{NN}` (sequential)
- Description: What the feature must do
- Acceptance Criteria: Observable truths (testable statements)
- Source: Which file/function proves this requirement exists

**Non-Functional Requirements:**
- Performance constraints (timeouts, caching, lazy loading)
- Accessibility requirements (content descriptions, focus order)
- Offline behavior
- Error states and recovery

**Edge Cases:**
- Empty states
- Error states
- Boundary conditions (max items, long text, slow network)
- Platform-specific behaviors
</step>

<step name="create_architecture_mapping">
**5. Create cross-platform architecture mapping**

Build a mapping table of technologies used in this feature:

**Android → iOS mapping (only include what's relevant):**
| Android (Kotlin) | iOS (Swift/SwiftUI) | Notes |
|---|---|---|
| ViewModel (MVI) | ObservableObject / @Observable | State management |
| Jetpack Compose | SwiftUI | UI framework |
| Koin DI | Environment / factory pattern | Dependency injection |
| Room Database | Core Data / SwiftData | Local persistence |
| Ktor Client | URLSession / Alamofire | Networking |
| ExoPlayer (Media3) | AVPlayer / AVFoundation | Media playback |
| Firebase Analytics | Firebase Analytics (iOS SDK) | Analytics |
| Navigation Compose | NavigationStack / NavigationPath | Navigation |
| Coroutines/Flow | async/await, Combine | Async/reactive |
| DataStore | UserDefaults / @AppStorage | Preferences |
| WorkManager | BGTaskScheduler | Background work |
| Coil | AsyncImage / Kingfisher | Image loading |
| Material3 | Native SwiftUI components | Design system |
| Mapbox SDK | Mapbox SDK (iOS) | Maps |

**iOS → Android mapping:** (reverse of above)
</step>

<step name="generate_porting_document">
**6. Generate the comprehensive porting document**

```markdown
# Feature Port: {Feature Name}
## Source: {Platform} → Target: {Platform}
## Generated: {date}
## Source: Code scan of "{feature description}"

---

## Executive Summary
{1-2 paragraph description of what this feature does, why it exists, and what the user experiences. Derived from code analysis.}

---

## Discovered Source Files
{Complete list of files that implement this feature, organized by layer}

### Presentation Layer
- {file} — {purpose}

### Domain Layer
- {file} — {purpose}

### Data Layer
- {file} — {purpose}

### DI / Wiring
- {file} — {purpose}

### Tests
- {file} — {purpose}

---

## Requirements (Reverse-Engineered)

### Functional Requirements
{Each requirement derived from code:}
- **PORT-01**: {description}
  - Acceptance Criteria: {observable truth}
  - Source evidence: {file:function}

### Non-Functional Requirements
{Performance, accessibility, offline, etc.}

---

## Business Logic Specification

### Core Behaviors
{Platform-agnostic description of each behavior:}

#### Behavior: {Name}
- **Trigger**: {What causes this behavior}
- **Input**: {What data is needed}
- **Processing**: {Step-by-step logic in pseudocode}
- **Output**: {What happens as a result}
- **Edge Cases**: {Boundary conditions}

### State Machine / Flow
{States, transitions, side effects — if applicable}

### Data Models
{Platform-agnostic model definitions in pseudocode}
```
Model: {Name}
  - field1: Type (description)
  - field2: Type (description)
```

---

## Analytics Specification
{If the feature includes analytics:}

### Events
| Event Name | Component | Action | Parameters | When Fired |
|---|---|---|---|---|
| {name} | {component} | {action} | {params} | {trigger} |

### Metadata / Enrichment
{Cross-cutting params}

---

## API / Network Contracts
{If applicable}

### Endpoint: {name}
- **Method**: GET/POST/etc.
- **URL**: {path}
- **Request**: {model}
- **Response**: {model}
- **Error handling**: {strategy}

---

## Database / Persistence
{If applicable}

### Entity: {name}
- **Fields**: {field definitions}
- **Queries**: {CRUD operations}
- **Caching**: {strategy}

---

## UI Specification

### Screens
#### Screen: {Name}
- **Purpose**: {what the user sees/does}
- **Layout**: {description of UI structure}
- **States**: {loading, content, error, empty}
- **Interactions**: {user actions}
- **Navigation**: {entry/exit points}

### Components
#### Component: {Name}
- **Props/Input**: {what it receives}
- **Appearance**: {visual description}
- **Behavior**: {interaction behavior}

---

## Target Platform Implementation Guide

### Architecture Recommendation
- **Pattern**: {recommended pattern for target}
- **DI approach**: {target DI strategy}
- **State management**: {target state approach}

### Technology Mapping
| Source ({platform}) | Target ({platform}) | Notes |
|---|---|---|
| {source tech} | {target tech} | {notes} |

### Key Implementation Notes
{Platform-specific gotchas, best practices}

### Suggested File Structure
```
{target platform file tree}
```

---

## Test Cases

### Unit Tests
#### Test: {Name}
- **Given**: {precondition}
- **When**: {action}
- **Then**: {expected outcome}

### Manual Test Plan
| # | Scenario | Steps | Expected Result |
|---|---|---|---|
| 1 | {name} | {steps} | {expected} |

---

## Dependencies

### Required Libraries
| Library | Purpose | Source Equivalent |
|---|---|---|
| {lib} | {what for} | {source lib} |

---

## Migration Checklist

- [ ] Data models created
- [ ] Business logic implemented
- [ ] UI screens built
- [ ] Analytics events wired
- [ ] API integration connected
- [ ] Database schema set up
- [ ] Unit tests written
- [ ] Manual test plan executed

---

## Appendix: Source Code Snippets
{Key code snippets from the source for reference — helps the target developer understand intent}
```
</step>

<step name="write_output">
**7. Write the porting document**

Output path:
- If `--output` provided, use that
- Otherwise: `.planning/ports/{feature-slug}-{target-platform}-port.md`

Create `.planning/ports/` directory if it doesn't exist.
</step>

<step name="completion">
**8. Present completion summary**

```
Port document generated from code scan:
- Feature: "{feature description}"
- Source: {source platform} ({N} files analyzed)
- Target: {target platform}
- Document: {output path}
- Requirements: {count} derived from code
- Test cases: {count}
- Analytics events: {count}

---

## Next Steps

Use this document as input for an AI coding agent:

### With GSD
`/gsd:new-milestone` → paste the porting document as requirements

### Without GSD
Provide the document to any AI agent with instructions to implement each requirement

### Manual
Use as a reference spec for manual development

---
```
</step>

</process>

<guidelines>

## Discovery Thoroughness

- **Cast a wide net first, then narrow** — search broadly by keywords, then trace dependencies to find all related files
- **Don't miss the wiring** — DI modules, navigation graphs, and manifest entries are easy to forget but critical for completeness
- **Check for tests** — existing tests are a goldmine of requirements and edge cases
- **Read comments and KDoc** — they often explain WHY something exists

## Code Analysis Depth

- **Read the actual code**, don't just grep for function names
- **Follow the data flow** — from UI interaction → ViewModel → repository → API/DB and back
- **Extract business rules as pseudocode** — not source-language code
- **Capture error handling** — how the feature fails gracefully is as important as how it succeeds
- **Note thread/concurrency patterns** — these often differ significantly between platforms

## Platform-Agnostic Principle

The porting document should be **80% platform-agnostic** (what the feature does) and **20% target-specific** (how to build it). A developer who has never seen the source codebase should be able to implement the feature from this document alone.

## Quality Criteria

The document is ready when:
1. A developer can understand WHAT the feature does without reading source code
2. Every behavior has pseudocode logic
3. Every analytics event has full parameter specification
4. Every UI screen has layout and interaction description
5. Every test case has given/when/then
6. Architecture mapping covers all technology choices
7. An AI coding agent could implement the feature from this document alone

</guidelines>
