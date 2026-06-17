---
name: quokka:feature-test-design
description: Interview to ~95% confidence, research the live codebase, then produce a risk-prioritized, automation-tagged test plan (12-column template) before building a feature. Outputs docs/test-plans/<feature>.md and optional Confluence page.
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

Run the `quokka-feature-test-design` skill to build a complete, prioritized, code-grounded test plan for a feature BEFORE implementation.

# Process

1. Invoke the `quokka-feature-test-design` skill via the Skill tool and follow it exactly.
2. Treat `$ARGUMENTS` as the feature under test (a feature name and/or a ticket/epic key such as `MA-2236`). If empty, the skill's Phase 0 will ask for it.
3. Do not skip the Phase 1 confidence gate — the skill must not write the plan until the gate passes.

If the `quokka-feature-test-design` skill is not installed, tell the dev to run `npx --yes github:quokkapps/quokka_skills` (or `/quokka:update`) and restart Claude Code.
