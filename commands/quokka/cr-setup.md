---
name: quokka:cr-setup
description: Set up the change-request flow on this machine for one project (QuokkaGuide or INS). Maps every repo the project needs (QuokkaGuide needs both the mobile repo and the web repo), checks logins, picks the Android emulator and iOS simulator, and checks the environment and gate commands.
argument-hint: "[qg | ins | <slug>]"
allowed-tools:
  - Skill
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - AskUserQuestion
  - ToolSearch
---

# Objective

Run the `quokka-cr` skill with `setup $ARGUMENTS`.

# Process

1. Invoke the `quokka-cr` skill via the Skill tool and follow `references/setup.md` §Full setup.
2. Pass the project slug through unchanged. With no argument, ask which project: QuokkaGuide (`qg`) or INS (`ins`), or a new one.
3. Settings go to `~/.quokka/cr/` only. The only other writes are ones the dev confirms: cloning a missing repo into their source folder, and, for a new project, creating its CR list. Never write a password, token or file contents anywhere.

If the `quokka-cr` skill is not installed, tell the dev to run `npx --yes github:quokkapps/quokka_skills` (or `/quokka:update`) and restart Claude Code.
