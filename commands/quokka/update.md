---
name: quokka:update
description: Update Quokka AI commands to the latest version
allowed-tools:
  - Bash
  - Read
---

<objective>
Pull the latest Quokka AI commands from GitHub and replace the current commands.
</objective>

<process>

**Step 1: Check current version**

Read the current installed commands to note what exists:
```bash
ls .claude/commands/quokka/ 2>/dev/null
```

**Step 2: Run the installer from GitHub**

Execute the install script directly from the repo — this pulls the latest version and overwrites all commands:
```bash
npx --yes github:quokkapps/quokka_skills
```

**Step 3: Verify installation**

List the updated commands:
```bash
ls .claude/commands/quokka/
```

**Step 4: Report to user**

Tell the user:
- Which commands were updated
- Remind them to restart Claude Code session to pick up the changes

</process>
