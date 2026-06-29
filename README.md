# Quokka AI

Shared Claude Code commands for the Quokkapps team. Generates platform-agnostic porting documents from source code analysis or GSD planning artifacts.

## Commands

| Command | Description |
|---------|-------------|
| `/quokka:port-feature` | Scan source code by feature description and generate a platform-agnostic porting document. For features NOT built with GSD. |
| `/quokka:port-gsd-feature` | Analyze a completed GSD feature (phase, milestone, quick task) and generate a platform-agnostic porting document. For features built with GSD. |
| `/quokka:feature-test-design` | Before building a mobile native / KMP feature (Android/iOS): interview the dev, research the live code, and generate a test plan that clearly marks the must-test 20%. |
| `/quokka:update` | Update commands to the latest version from GitHub. |

## Skills

| Skill | Description |
|-------|-------------|
| `quokka-feature-test-design` | The engine behind `/quokka:feature-test-design`. For Android / iOS / KMP repos: a 9-item interview, code-grounded use-case discovery, and a two-tier plan that calls out the must-test 20% the dev executes. Writes to `docs/test-plans/` (+ optional Confluence). |

Skills install into `.claude/skills/` via the same installer. Run `/quokka:feature-test-design`
to use it, or invoke the skill directly.

## Hooks

| Hook | Description |
|------|-------------|
| `SessionEnd` knowledge base | When a Claude Code session ends, a background job judges whether the work was worth recording. If so, it writes an HTML summary (overview, **key decisions + rationale**, core ideas, outputs/artifacts) to `knowledge-base/<date>_<title>.html`. Trivial sessions are skipped. |

How it works:

- Two scripts install into `.claude/hooks/`: `quokka-knowledge-summary.sh` (dispatcher — detaches the work so it never blocks the session closing) and `quokka-knowledge-worker.sh` (extracts the transcript, asks a headless `claude -p` to judge + summarize, writes the file).
- The installer idempotently registers the `SessionEnd` hook in `.claude/settings.json` (existing settings and hooks are preserved).
- A cheap pre-filter skips short/trivial sessions before spending any tokens; the rest are judged by the model, which writes nothing for sessions with no meaningful decisions.
- Requires `jq` and the `claude` CLI on PATH. A recursion guard (`CLAUDE_KB_SUMMARY_GUARD`) prevents the summary's own `claude` call from re-triggering the hook.

> Note: `SessionEnd` hooks added mid-session may need a Claude Code restart (or opening `/hooks` once) to load.

## Installation

Run from any project directory where you want the commands available:

```bash
npx --yes github:quokkapps/quokka_skills
```

This copies commands into `.claude/commands/quokka/`, skills into `.claude/skills/`, and hook scripts into `.claude/hooks/` in the nearest `.claude` directory, and registers the `SessionEnd` knowledge-base hook in `.claude/settings.json`.

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
- Skills install into `.claude/skills/`; hook scripts into `.claude/hooks/` (with the `SessionEnd` hook registered in `.claude/settings.json`)
- Versioning is controlled by git tags (e.g., `git tag v1.1.0 && git push --tags`)
- The install script (`bin/install.js`) handles install, update, and uninstall (uninstall also removes the hook scripts and the `SessionEnd` settings entry)
