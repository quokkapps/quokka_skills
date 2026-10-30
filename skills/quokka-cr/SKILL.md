---
name: quokka-cr
description: Use when someone wants to build, change or redesign a feature in a Quokkapps project (QuokkaGuide, INS LifeGuardian/Connect, or any project set up for it), or runs /quokka:cr. Runs the change-request flow. A CR list row, then a CR detail doc, then a CR design canvas with one page per surface (app/web), then one human build approval after the dev reviews both (the dev may skip the detail or design for a simple CR). Then the hand-off to the *-Design-Main canvases and tickets (GitHub, or Jira + Confluence), then a test-first build with Codex review and proof screenshots, then close. Never writes product code without a build approval.
---

# quokka-cr: the change-request flow

One flow for every project:

```
new → detail → design → [approve: dev reviews both] → handoff (copy to main canvas, tickets, INS Confluence page)
    → build → PR (dev says yes) → close
    … later, Tam only: cleanup
```

The row never needs approval. The dev may skip the detail or the design for a simple CR; the skill never skips one on its own.

The skill sits between people and four systems: Claude artifacts (canvases, docs, the CR list), git repos, ticket systems, and devices. Read the reference for the step you're on **before** acting. Each one is short.

## Hard rules (never break)

1. **No code without a build approval.** Product code is written only inside `build`, and only when the CR's build approval is current (detail and design unchanged since, or skipped by the dev) and the hand-off reads `links-recorded`. If someone asks to "just build X", run `new` instead. If the detail or design is missing, offer to generate it first (`references/identity-and-gates.md` §Missing detail or design).
2. **Identity comes from tool logins, never from the Claude account.** All devs share one Claude account. Read the dev's `gh` / Bitbucket / `acli` login before recording anything. See `references/identity-and-gates.md`.
3. **Never merge. Never push or open a PR without the dev's explicit yes.**
4. **Never delete** an artifact, ticket or page, except in `cleanup` with a typed per-CR confirmation.
5. **Never overwrite** someone's work on a canvas, doc or list. Re-read right before writing; a refused publish means re-read and re-apply. See `references/artifacts.md`.
6. **Never mix design systems** on one surface. Each surface page uses its own DS.
7. **Device rules from the project file go into every builder brief verbatim.** These include emulator-only Android installs and never running Gradle `install*`/`connected*` tasks.
8. **Always end with the next command.** See `references/next-command.md`.

## Step 0 (every run): load the project

`health` skips Step 0 and goes straight to `setup.md` §Health. It never runs setup: a missing project or local file is reported, not created.

1. **Resolve the project, in this order:**
   1. the prefix in a CR id argument (`QG-CR-21` means `qg`). Never ask for `--project`, or print it in a next command, when a CR id is present.
   2. a `--project <slug>` flag, or the slug argument of `setup` (`setup ins` means `ins`)
   3. the current folder's git root (or the current folder) matched against `repos.*.path` and `knownFolders` in `~/.quokka/cr/*.local.json`
   4. otherwise, ask which project and save the folder to that project's `knownFolders`

   If a CR id and the flag disagree, stop and say so.
2. **Load the shared file** from `~/.quokka/cr/projects/<slug>.json`, falling back to `~/.quokka/cr/projects/local/<slug>.json`. A shipped file wins on a slug clash. A v1.4 file with `approvers` and no `signoff` uses the approvers' `role` values, in order, as `signoff`. If the file is missing, run setup (`references/setup.md`).
3. **Load the local file** `~/.quokka/cr/<slug>.local.json`. If it is missing or incomplete for the roles this sub-command needs, run local setup (`references/setup.md`). Where the local file has `repos.<role>.gates`, those commands replace the shared file's gate commands for that role.
4. **Read the dev's tool login** (`references/identity-and-gates.md`). Read-only sub-commands may continue without it. Writes may not.

## Sub-commands

| Run | Read first | Needs |
|---|---|---|
| *(none)* | `lists.md`, `next-command.md` | — |
| `<CR-id>` | `next-command.md` §Drive, then the step's own reference | the row |
| `setup [qg\|ins\|<slug>]` | `setup.md` §Full setup | — |
| `health [<slug>]` | `setup.md` §Health | — (read-only) |
| `new <idea>` | `lists.md`, `detail-and-design.md` §New | — |
| `detail <CR-id>` | `detail-and-design.md` §Detail, `artifacts.md` | the row |
| `design <CR-id>` | `detail-and-design.md` §Design, `artifacts.md` | detail exists or skipped |
| `approve <CR-id> [name]` | `identity-and-gates.md`, `lists.md` | detail and design each exist or skipped |
| `handoff <CR-id>` | `handoff.md`, `artifacts.md` | build approval current |
| `build <CR-id>` | `build.md`, `builder-brief.md` | hand-off `links-recorded`, approval not stale |
| `close <CR-id>` | `close-and-cleanup.md` §Close | every PR merged |
| `cleanup` | `close-and-cleanup.md` §Cleanup | — |
| `resume` | `build.md` §Resume, `handoff.md` §Resume | an in-flight ledger |
| `share-project <slug>` | `setup.md` §Share | a local project file |

`approve` runs `handoff` straight after, unless the dev says not to.

Devs normally use four commands: `/quokka:cr-setup` (runs `setup`), `/quokka:cr-health` (runs `health`), `/quokka:cr <CR-id>` (runs the CR's next step), and `/quokka:cr-help` (explains the flow). The other sub-commands still work for a dev who wants one step explicitly.

Any sub-command run on a CR id whose approval is pending or stale first checks for a missing detail or design and offers to generate it (`identity-and-gates.md`).

## Naming

- CR id: `<PFX>-CR-<n>`, with `n` zero-padded to `idWidth`. QG: `QG-CR-07`. INS: `INS-CR-007`.
- Artifacts: `<PFX>-CR-List`, `<PFX>-CR-<n>-Detail <title>`, `<PFX>-CR-<n>-Design <title>`, `<PFX>-<Surface>-Design-Main`, `<PFX>-<Surface>-DS`.
- Branch: `<PFX>-CR-<n>-<slug>`.
- Screenshots: `screenshot/<CR-id>/<description>_<platform>.png` under the folder the session started in.

## Reporting

Keep chat short. Lead with what changed, then any links, then the next command. Put long material in the artifact (doc, canvas, ledger), not in chat.
