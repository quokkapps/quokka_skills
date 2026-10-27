# Setup: project files and the local file

Two files configure a project. The shared one says what the project is. The local one says where it lives on this machine.

| File | Where | Who writes it | Committed |
|---|---|---|---|
| Shared | `~/.quokka/cr/projects/<slug>.json` (shipped by the installer) | the `quokka_skills` repo | yes, in `projects/` |
| Shared, new project | `~/.quokka/cr/projects/local/<slug>.json` | setup, on this machine | no, until `share-project` |
| Local | `~/.quokka/cr/<slug>.local.json` | setup, on this machine | never |

Field meanings are in `projects/README.md` in `quokkapps/quokka_skills`. Use the shipped `qg.json` and `ins.json` as worked examples. Never put a path, clone URL, password or token in a shared file.

## Local setup (project file exists, local file missing or incomplete)

Ask only for what the current sub-command needs. `new`/`detail`/`design`/`approve` need nothing local. `handoff` needs nothing local. `build` and `close` need the repos it touches.

1. **Repo clones.** For each role needed, ask for the clone path. Offer any folder under the dev's source directory whose remote matches.
2. **Identity check for each clone.** Run `git -C <path> remote -v`. Normalise every fetch URL to `provider:owner/repo`:
   - `git@github.com:owner/repo.git`, `https://github.com/owner/repo(.git)`, `ssh://git@github.com/owner/repo` give `github:owner/repo`
   - the same forms on `bitbucket.org` give `bitbucket:owner/repo`
   - compare case-insensitively
   One remote must match the role's `id`. If none does, say so and do not save the path. Save the matching remote's name as `remote` (often `origin`, sometimes `upstream`). Build fetches, branches and pushes through that remote only. Re-check the match before every build and push.
3. **Devices** (only for a role whose `kind` is mobile):
   - Android: `adb devices`. Offer only serials that start with `emulator-`. Never save a physical device.
   - iOS: `xcrun simctl list devices available`. Save the UDID.
4. **Environment.** `JAVA_HOME` for Android/KMP (JDK 17 unless the repo says otherwise).
5. **Secrets source.** For each role with `gitignoredFiles`, ask which existing clone holds them. Check that each file exists there. Save only the path, never the contents.
6. Write `~/.quokka/cr/<slug>.local.json` with mode 600. Add the current folder to `knownFolders`.

## New project (no shared file for the slug)

Interview the dev, one question at a time. Use the shipped files as the worked examples.

1. Name, slug (lowercase), prefix (upper case), `idWidth`.
   - Refuse a slug that already exists in `~/.quokka/cr/projects/`.
2. The CR list.
   - Use an existing one if the dev has it.
   - Otherwise create a Claude Docs doc `<PFX>-CR-List` with the table from `lists.md`.
3. Surfaces. For each surface:
   - its `*-Design-Main` canvas and `*-DS`, existing or new
   - the repo roles that implement it
4. Approvers.
   - Default: anyone, attested by tool login.
   - Named approvers need Atlassian account ids.
5. Tickets: GitHub (`owner/repo` per role) or Jira (site + project). Confluence: none, or space + parent page.
6. Repos: role, `provider:owner/repo`, kind, default branch, gate commands. Read gate commands from the repo's `AGENTS.md`, `CLAUDE.md`, `package.json` or Gradle files, and show them to the dev before saving.
7. Device rules. Always include the emulator-only Android rule from the shipped files when there is an Android repo.
8. Test account pointer (who to ask). Never the credentials.

Write the file to `~/.quokka/cr/projects/local/<slug>.json`, then run local setup.

Next: `/quokka:cr new <idea> --project <slug>`, or `/quokka:cr share-project <slug>` to offer it to the team.

## Share

`share-project <slug>` opens a PR that adds `projects/<slug>.json` to `quokkapps/quokka_skills`, from the dev's own GitHub account.

1. Check the file for paths, URLs with credentials, tokens, emails and phone numbers. Stop if any are found.
2. Show the diff and the PR title `feat(cr): add <name> project`. Ask the dev to confirm before any push.
3. Clone or update the dev's checkout of `quokka_skills`, branch `cr-project-<slug>`, commit, push, `gh pr create`. Never merge.
4. Tell the dev: once it ships and they update, delete `~/.quokka/cr/projects/local/<slug>.json` (the shipped file wins from then on).

## Shipped file wins

When a slug exists in both places, use the shipped file. Tell the dev once that the local copy can be deleted.
