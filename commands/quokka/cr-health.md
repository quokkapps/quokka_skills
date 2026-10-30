---
name: quokka:cr-health
description: Read-only health check for the change-request flow on this machine. Lists every project that is set up and anything missing or broken - repo clones, remotes, git-ignored secret files, logins, emulator and simulator, environment, gate commands, Codex, and the installed version.
argument-hint: "[qg | ins | <slug>]"
allowed-tools:
  - Skill
  - Read
  - Glob
  - Grep
  - Bash
---

# Objective

Run the `quokka-cr` skill with `health $ARGUMENTS`.

# Process

1. Invoke the `quokka-cr` skill via the Skill tool and follow `references/setup.md` §Health.
2. With a slug, check only that project. With no argument, check every project.
3. This command only reads. It never writes a file, fetches, clones, installs, logs in or starts a device. It never prints a secret file's contents.

If the `quokka-cr` skill is not installed, tell the dev to run `npx --yes github:quokkapps/quokka_skills` (or `/quokka:update`) and restart Claude Code.
