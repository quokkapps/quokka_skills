# Quokka Skills

Shared Claude Code plugin for the Quokkapps team.

## Commands

| Command | Description |
|---------|-------------|
| `/port-feature` | Scan source code by feature description and generate a porting document for the target platform (Android/iOS). For features NOT built with GSD. |
| `/port-gsd-feature` | Analyze a completed GSD feature and generate a porting document for the target platform. For features built with GSD. |

## Installation

**Step 1: Add the marketplace (one-time)**
```bash
claude plugin marketplace add quokkapps/quokka_skills
```

**Step 2: Install the plugin**
```bash
claude plugin install quokka-ai
```

Updates are pulled automatically when Claude Code refreshes marketplaces.

## Usage

In any project with Claude Code:

```
/port-feature analytics for InTour screen
/port-feature audio playback --to ios --scope app/src/main/.../feature/audio/

/port-gsd-feature phase 16
/port-gsd-feature milestone v1.2 --to ios
```
