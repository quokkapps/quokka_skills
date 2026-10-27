# Quokka AI

Shared Claude Code commands and skills for the Quokkapps team: the `/quokka:cr` change-request flow and mobile feature test design.

## Commands

| Command | Description |
|---------|-------------|
| `/quokka:feature-test-design` | Before building a mobile native / KMP feature (Android/iOS): interview the dev, research the live code, and generate a test plan that clearly marks the must-test 20%. |
| `/quokka:cr` | Change-request flow from idea to shipped code: CR list row → CR detail doc → CR design canvas (one page per surface), each approved, then hand-off to the `*-Design-Main` canvases and tickets, a test-first build with Codex review and proof screenshots, and close. Installed globally, so it works from any folder. |
| `/quokka:update` | Update commands to the latest version from GitHub. |

## Skills

| Skill | Description |
|-------|-------------|
| `quokka-feature-test-design` | The engine behind `/quokka:feature-test-design`. For Android / iOS / KMP repos: a 9-item interview, code-grounded use-case discovery, and a two-tier plan that calls out the must-test 20% the dev executes. Writes to `docs/test-plans/` (+ optional Confluence). |

| `quokka-cr` | The engine behind `/quokka:cr`. Project settings ship in `projects/*.json` (QG, INS); each dev's clone paths and devices live in `~/.quokka/cr/<slug>.local.json`, written on first run. |

Skills install into `.claude/skills/` via the same installer. Run `/quokka:feature-test-design`
to use it, or invoke the skill directly.

## Installation

Run from any project directory where you want the commands available:

```bash
npx --yes github:quokkapps/quokka_skills
```

This installs `/quokka:cr` and its skill globally (`~/.claude/commands/quokka/cr.md`, `~/.claude/skills/quokka-cr/`) plus the shipped project files to `~/.quokka/cr/projects/`, and copies the other commands into `.claude/commands/quokka/` and skills into `.claude/skills/` in the nearest `.claude` directory.

Updating from v1.3 or earlier removes the retired `/quokka:port-feature` and `/quokka:port-gsd-feature` commands and the `SessionEnd` knowledge-base hook (scripts and `settings.json` entry). Your other settings and hooks are kept.

## Updating

From within Claude Code:

```
/quokka:update
```

Or from terminal:

```bash
npx --yes github:quokkapps/quokka_skills
```

The installer tracks versions — it will show "Already up to date" if you're current, or "Updating from vX to vY" when a new version is available.

## Uninstalling

```bash
npx github:quokkapps/quokka_skills --uninstall
```

## Usage

```
/quokka:cr                          # set up, then list CRs and the next command for each
/quokka:cr new <idea>               # add a CR list row
/quokka:cr build QG-CR-22           # build an approved, handed-off CR
/quokka:feature-test-design <feature>
```

## How it works

- Commands are installed as standard Claude Code slash commands in `.claude/commands/quokka/`
- Skills install into `.claude/skills/`; `/quokka:cr` and its skill install globally into `~/.claude/`
- Versioning is controlled by git tags (e.g., `git tag v1.1.0 && git push --tags`)
- The install script (`bin/install.js`) handles install, update, and uninstall
