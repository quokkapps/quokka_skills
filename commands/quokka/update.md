---
name: quokka:update
description: Update Quokka AI commands to the latest version
allowed-tools:
  - Bash
  - Read
---

<objective>
Check for updates and install the latest Quokka AI commands from GitHub.
</objective>

<process>

**Step 1: Check current installed version**

```bash
cat .claude/commands/quokka/.version 2>/dev/null || echo "unknown"
```

**Step 2: Check latest available version**

```bash
npm view github:quokkapps/quokka_skills version 2>/dev/null || curl -s https://raw.githubusercontent.com/quokkapps/quokka_skills/main/package.json | grep '"version"' | head -1
```

**Step 3: Run the installer**

This pulls the latest and replaces all commands:
```bash
npx --yes github:quokkapps/quokka_skills
```

The installer will show:
- "Already up to date" if no new version
- "Updating from vX to vY" if there's a new version

**Step 4: Report to user**

If updated, remind them to restart Claude Code to pick up changes.

</process>
