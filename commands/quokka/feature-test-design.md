---
name: quokka:feature-test-design
description: Before building a feature in a mobile native or KMP app (Android/iOS), interview the dev, research the live code, and produce a test plan that clearly marks the must-test 20%. Outputs docs/test-plans/<feature>.md and an optional Confluence page.
argument-hint: "<feature name or ticket key>"
allowed-tools:
  - Skill
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Agent
  - AskUserQuestion
  - ToolSearch
  - WebFetch
---

# Objective

Run the `quokka-feature-test-design` skill to build a code-grounded test plan for a mobile native / KMP feature BEFORE implementation, with the must-test 20% clearly marked.

# Process

1. Invoke the `quokka-feature-test-design` skill via the Skill tool and follow it exactly.
2. Treat `$ARGUMENTS` as the feature under test (a feature name and/or a ticket/epic key such as `MA-2236`). If empty, the skill will ask for it.
3. Do not skip the interview — the skill must not write the plan until the checklist is resolved.

If the `quokka-feature-test-design` skill is not installed, tell the dev to run `npx --yes github:quokkapps/quokka_skills` (or `/quokka:update`) and restart Claude Code.
