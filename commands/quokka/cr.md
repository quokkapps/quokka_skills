---
name: quokka:cr
description: Change-request flow from idea to shipped code. CR list row, then CR detail doc, then CR design canvas (app + web), then one build approval, hand-off to the main design canvas and tickets, test-first build with Codex review and proof screenshots, then close. Nothing is built without a build approval. Run /quokka:cr-help for how it works.
argument-hint: "[<CR-id> | new <idea> | detail <CR-id> | design <CR-id> | approve <CR-id> [name] | handoff <CR-id> | build <CR-id> | close <CR-id> | cleanup | resume | share-project <slug>] [--project <slug>]"
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
2. Pass `$ARGUMENTS` through unchanged. Empty arguments mean "show this project's CRs and the next command for each". A bare CR id (`/quokka:cr QG-CR-07`) means "run that CR's next step" (`references/next-command.md` §Drive). If this machine is not set up, suggest `/quokka:cr-setup`.
3. If someone asks to build or change a feature and there is no CR for it yet, run `new` first. Never write product code outside `build`.

If the `quokka-cr` skill is not installed, tell the dev to run `npx --yes github:quokkapps/quokka_skills` (or `/quokka:update`) and restart Claude Code.
