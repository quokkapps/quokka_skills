# Quokka AI

Shared Claude Code commands for the Quokkapps team. Generates platform-agnostic porting documents from source code analysis or GSD planning artifacts.

## Commands

| Command | Description |
|---------|-------------|
| `/quokka:port-feature` | Scan source code by feature description and generate a platform-agnostic porting document. For features NOT built with GSD. |
| `/quokka:port-gsd-feature` | Analyze a completed GSD feature (phase, milestone, quick task) and generate a platform-agnostic porting document. For features built with GSD. |
| `/quokka:update` | Update commands to the latest version from GitHub. |

## Installation

Run from any project directory where you want the commands available:

```bash
npx --yes github:quokkapps/quokka_skills
```

This copies commands into `.claude/commands/quokka/` in the nearest `.claude` directory.

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

### Port a feature from source code (no GSD)

```
/quokka:port-feature analytics for InTour screen
/quokka:port-feature audio playback during tour navigation
/quokka:port-feature offline tour download --scope app/src/main/.../feature/download/
```

### Port a GSD feature from planning artifacts

```
/quokka:port-gsd-feature phase 16
/quokka:port-gsd-feature milestone v1.2
/quokka:port-gsd-feature quick 2
```

Both commands output a platform-agnostic porting document to `.planning/ports/`. The document describes WHAT the feature does, not HOW to implement it — the destination team decides their own architecture.

## How it works

- Commands are installed as standard Claude Code slash commands in `.claude/commands/quokka/`
- Versioning is controlled by git tags (e.g., `git tag v1.1.0 && git push --tags`)
- The install script (`bin/install.js`) handles install, update, and uninstall
