---
name: quokka:cr
description: Change-request flow from idea to shipped code. CR list row, then CR detail doc, then CR design canvas (app + web), then hand-off to the main design canvas and tickets, then test-first build with Codex review and proof screenshots, then close. Nothing is built without an approved CR detail and design.
argument-hint: "[new <idea> | detail <CR-id> | design <CR-id> | approve <CR-id> [row|detail|design] [name] | handoff <CR-id> | build <CR-id> | close <CR-id> | cleanup | resume | share-project <slug>] [--project <slug>]"
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

Run the `quokka-cr` skill for the sub-command in `$ARGUMENTS`.

# Process

1. Invoke the `quokka-cr` skill via the Skill tool and follow it exactly.
2. Pass `$ARGUMENTS` through unchanged. Empty arguments mean "set up if needed, then show this project's CRs and the next command for each".
3. If someone asks to build or change a feature and there is no CR for it yet, run `new` first. Never write product code outside `build`.

If the `quokka-cr` skill is not installed, tell the dev to run `npx --yes github:quokkapps/quokka_skills` (or `/quokka:update`) and restart Claude Code.
