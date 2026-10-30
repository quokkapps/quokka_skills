---
name: quokka:cr-help
description: Explain how the /quokka:cr change-request flow works, in plain words. Optional topic (approve, skip, handoff, build, close, setup) or a CR id to say where that CR stands and what to run next.
argument-hint: "[topic | <CR-id>]"
allowed-tools:
  - Skill
  - Read
  - Bash
  - ToolSearch
---

# Objective

Explain the `/quokka:cr` flow to a developer. This command only explains. It never writes to the CR list, an artifact, a ticket or a repo.

# Process

1. **No arguments:** show the explanation below, trimmed to what fits on one screen. Keep the flow diagram, the steps table and the rules.
2. **A topic** (`approve`, `skip`, `handoff`, `build`, `close`, `setup`, `workflow`, or a question): answer only that part, from the explanation below. For detail, read the matching reference in the installed `quokka-cr` skill (`~/.claude/skills/quokka-cr/references/`, or under `$CLAUDE_CONFIG_DIR/skills/`).
3. **A CR id** (`QG-CR-07`, `INS-CR-012`): invoke the `quokka-cr` skill read-only. Load the project and read that CR's row. Say what exists (detail, design, approval, hand-off, PRs) and give the next command from `references/next-command.md`. Write nothing.

End with one line: the command the dev most likely wants next.

If the `quokka-cr` skill is not installed, tell the dev to run `npx --yes github:quokkapps/quokka_skills` (or `/quokka:update`) and restart Claude Code.

# The explanation

## What it is

A change request (CR) is one feature or change, tracked from idea to merged code. Every CR has an id like `QG-CR-07` or `INS-CR-012` and a row on the project's CR list. Claude writes no product code for a CR until a developer approves it.

## The commands

| Command | Use it to |
|---|---|
| `/quokka:cr-setup [qg\|ins]` | Set up this machine once per project: repos (QuokkaGuide needs both the mobile and the web repo), logins, emulator and simulator, environment. |
| `/quokka:cr <CR-id>` | Move a CR forward. Claude works out the next step and asks before each one. `/quokka:cr` alone lists open CRs; `/quokka:cr new <idea>` adds one. |
| `/quokka:cr-health [qg\|ins]` | Check what's set up on this machine and what's missing: repos, logins, emulator, simulator, environment, Codex. Changes nothing. |
| `/quokka:cr-help [topic\|CR-id]` | Read this. |

## The flow

```
new → detail → design → approve → handoff → build → PR → close
```

| Step | Explicit command (or just `/quokka:cr <id>`) | What happens |
|---|---|---|
| 1. New | `/quokka:cr new <idea>` | Adds a row to the CR list. The row needs no approval. |
| 2. Detail | `/quokka:cr detail <id>` | Claude reads the real code and writes the CR detail doc: problem, proposal, screens, repos, edge cases, acceptance criteria. |
| 3. Design | `/quokka:cr design <id>` | Claude builds the CR design canvas, one page per surface (app, web), in that surface's design system. |
| 4. Approve | `/quokka:cr approve <id>` | You review the detail and the design, then approve once. This is the only approval before code. |
| 5. Hand-off | runs after approve | Copies the design to the main canvas and creates the tickets. INS also gets a Confluence page. |
| 6. Build | `/quokka:cr build <id>` | Test-first build in a new worktree and branch, with Codex review and proof screenshots. Claude asks before it pushes or opens the PR. INS: Claude first asks whether Manager and Josh have approved. If not, you can still start; the PR waits until they have. |
| 7. Close | `/quokka:cr close <id>` | After you merge the PR, marks the CR Done and closes the tickets. |

You rarely need the explicit commands. Run `/quokka:cr <id>` and Claude does the next step. Run `/quokka:cr` to list open CRs with the next step for each.

## Missing pieces

Run `/quokka:cr <id>`. If the detail or design is missing, Claude says so and offers to generate it. Review what it writes, then approve.

## Skipping the detail or design

For a simple CR, tell Claude to skip a part ("no design needed, it's a copy fix").

- **Skip the detail:** Claude writes a short scope on the row instead, with numbered acceptance criteria. You approve that.
- **Skip the design:** fine when nothing visible changes. The hand-off skips the canvas copy.

Claude never skips a part on its own.

## After you approve

If someone edits the detail or design after you approve, the approval goes stale. Claude stops and asks you to review and approve again.

## Rules Claude always follows

- No product code without an approval.
- Never merges. Never pushes or opens a PR without your yes.
- Never deletes artifacts, tickets or pages. Only Tam runs `/quokka:cr cleanup`.
- Your identity comes from your `gh` or `acli` login, not the shared Claude account.
- Android installs go to the emulator only. Claude never runs Gradle `install*` or `connected*` tasks.

## First run

Run `/quokka:cr-setup qg` (or `ins`) once. It saves your clone paths, emulator, simulator and environment to `~/.quokka/cr/<project>.local.json`, on your machine only. Something not working? Run `/quokka:cr-health`.
