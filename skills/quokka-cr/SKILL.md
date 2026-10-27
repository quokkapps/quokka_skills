---
name: quokka-cr
description: Use when someone wants to build, change or redesign a feature in a Quokkapps project (QuokkaGuide, INS LifeGuardian/Connect, or any project set up for it), or runs /quokka:cr. Runs the change-request flow. A CR list row, then a CR detail doc, then a CR design canvas with one page per surface (app/web), each gate approved by a human. Then the hand-off to the *-Design-Main canvases and tickets (GitHub, or Jira + Confluence), then a test-first build with Codex review and proof screenshots, then close. Never writes product code without an approved CR detail and design.
---

# quokka-cr: the change-request flow

One flow for every project:

```
new → [approve row] → detail → [approve detail] → design → [approve design]
    → handoff (copy to main canvas, tickets, INS sign-off) → build → PR (dev says yes) → close
    … later, Tam only: cleanup
```

The skill sits between people and four systems: Claude artifacts (canvases, docs, the CR list), git repos, ticket systems, and devices. Read the reference for the step you're on **before** acting. Each one is short.

## Hard rules (never break)

1. **No code without approved gates.** Product code is written only inside `build`, and only when row, detail and design are approved at the **current** revisions and the hand-off reads `links-recorded`. If someone asks to "just build X", run `new` instead.
2. **Identity comes from tool logins, never from the Claude account.** All devs share one Claude account. Read the dev's `gh` / Bitbucket / `acli` login before recording anything. See `references/identity-and-gates.md`.
3. **Never merge. Never push or open a PR without the dev's explicit yes.**
4. **Never delete** an artifact, ticket or page, except in `cleanup` with a typed per-CR confirmation.
5. **Never overwrite** someone's work on a canvas, doc or list. Re-read right before writing; a refused publish means re-read and re-apply. See `references/artifacts.md`.
6. **Never mix design systems** on one surface. Each surface page uses its own DS.
7. **Device rules from the project file go into every builder brief verbatim.** These include emulator-only Android installs and never running Gradle `install*`/`connected*` tasks.
8. **Always end with the next command.** See `references/next-command.md`.

## Step 0 (every run): load the project

1. **Resolve the project, in this order:**
   1. the prefix in a CR id argument (`QG-CR-21` means `qg`). Never ask for `--project`, or print it in a next command, when a CR id is present.
   2. a `--project <slug>` flag
   3. the current folder's git root (or the current folder) matched against `repos.*.path` and `knownFolders` in `~/.quokka/cr/*.local.json`
   4. otherwise, ask which project and save the folder to that project's `knownFolders`

   If a CR id and the flag disagree, stop and say so.
2. **Load the shared file** from `~/.quokka/cr/projects/<slug>.json`, falling back to `~/.quokka/cr/projects/local/<slug>.json`. A shipped file wins on a slug clash. If the file is missing, run setup (`references/setup.md`).
3. **Load the local file** `~/.quokka/cr/<slug>.local.json`. If it is missing or incomplete for the roles this sub-command needs, run local setup (`references/setup.md`).
4. **Read the dev's tool login** (`references/identity-and-gates.md`). Read-only sub-commands may continue without it. Writes may not.

## Sub-commands

| Run | Read first | Needs |
|---|---|---|
| *(none)* | `lists.md`, `next-command.md` | — |
| `new <idea>` | `lists.md`, `detail-and-design.md` §New | — |
| `detail <CR-id>` | `detail-and-design.md` §Detail, `artifacts.md` | row approved |
| `design <CR-id>` | `detail-and-design.md` §Design, `artifacts.md` | detail approved |
| `approve <CR-id> [gate] [name]` | `identity-and-gates.md`, `lists.md` | the gate's artifact exists |
| `handoff <CR-id>` | `handoff.md`, `artifacts.md` | design approved |
| `build <CR-id>` | `build.md`, `builder-brief.md` | hand-off `links-recorded`, no stale gate |
| `close <CR-id>` | `close-and-cleanup.md` §Close | every PR merged |
| `cleanup` | `close-and-cleanup.md` §Cleanup | — |
| `resume` | `build.md` §Resume, `handoff.md` §Resume | an in-flight ledger |
| `share-project <slug>` | `setup.md` §Share | a local project file |

Approving `design` runs `handoff` straight after, unless the dev says not to.

## Naming

- CR id: `<PFX>-CR-<n>`, with `n` zero-padded to `idWidth`. QG: `QG-CR-07`. INS: `INS-CR-007`.
- Artifacts: `<PFX>-CR-List`, `<PFX>-CR-<n>-Detail <title>`, `<PFX>-CR-<n>-Design <title>`, `<PFX>-<Surface>-Design-Main`, `<PFX>-<Surface>-DS`.
- Branch: `<PFX>-CR-<n>-<slug>`.
- Screenshots: `screenshot/<CR-id>/<description>_<platform>.png` under the folder the session started in.

## Reporting

Keep chat short. Lead with what changed, then any links, then the next command. Put long material in the artifact (doc, canvas, ledger), not in chat.
