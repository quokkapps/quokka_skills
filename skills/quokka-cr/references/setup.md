# Setup: project files and the local file

Two files configure a project. The shared one says what the project is. The local one says where it lives on this machine.

| File | Where | Who writes it | Committed |
|---|---|---|---|
| Shared | `~/.quokka/cr/projects/<slug>.json` (shipped by the installer) | the `quokka_skills` repo | yes, in `projects/` |
| Shared, new project | `~/.quokka/cr/projects/local/<slug>.json` | setup, on this machine | no, until `share-project` |
| Local | `~/.quokka/cr/<slug>.local.json` | setup, on this machine | never |

Field meanings are in `projects/README.md` in `quokkapps/quokka_skills`. Use the shipped `qg.json` and `ins.json` as worked examples. Never put a path, clone URL, password or token in a shared file.

## Full setup (`setup`, run by `/quokka:cr-setup`)

Sets up everything a dev needs for one project in one go, so later commands never stop to ask.

1. **Project.** Use the argument (`qg`, `ins`, or another slug). Otherwise ask which project: QuokkaGuide (`qg`), INS (`ins`), or a new one. A new one runs §New project first.
2. **Logins.** Check the login for the project's ticket system (`identity-and-gates.md`): `gh auth status` for QG, `acli jira auth status` for INS, plus Bitbucket for INS code. Name any that are missing and the command that fixes it. Keep going; setup itself writes nothing outside this machine.
3. **Every repo role** in the project file, not just one. QuokkaGuide needs both: `app` (`quokkapps/quokkaguide-kmp`, mobile) and `web` (`quokkapps/quokkaguideweb`). INS needs `lg-android`, `lg-ios` and `connect`. For each, run steps 1, 2 and 5 of §Local setup. If the dev has no clone of a role yet, offer to clone it under their source folder, or skip the role for now and say which CRs will need it.
4. **Devices** once, if any repo is mobile: an Android emulator and an iOS simulator (step 3 of §Local setup).
5. **Environment** (step 4): `JAVA_HOME` for Android/KMP repos, and for web repos the Node version the repo pins (`.nvmrc`, `engines`), checked with `node -v`.
6. **Gate commands.** For each repo, show the project file's gate commands. If a command is a placeholder ("read the repo's package.json"), read the repo's `AGENTS.md`, `CLAUDE.md`, `package.json` or Gradle files, and save the real commands under `repos.<role>.gates` in the local file. Show them to the dev before saving.
7. Write the local file (step 6 of §Local setup) and print a summary table: role, clone, remote, devices, env, gates, and anything still missing.

Re-running `setup` shows the saved values and changes only what the dev asks to change.

Next: `/quokka:cr` to see the CRs, or `/quokka:cr <CR-id>`.

## Health (`health`, run by `/quokka:cr-health`)

Read-only. Never write, fetch, clone, install, log in or boot a device. Never print a secret file's contents.

1. **Projects.** List the shipped files in `~/.quokka/cr/projects/` and `projects/local/`. For each, say whether `~/.quokka/cr/<slug>.local.json` exists. A slug argument limits the check to that project.
2. **Install.** Compare the installed versions with the latest: `~/.quokka/cr/.version`, and the active config's `commands/quokka/.cr-version` (under `$CLAUDE_CONFIG_DIR`, or `~/.claude`). Each config dir updates separately, so the older of the two is the one that counts. Read the latest over HTTP without cloning (`curl -fsS https://raw.githubusercontent.com/quokkapps/quokka_skills/main/package.json`, take `version`; if that fails, say "unknown"). Check that `cr.md`, `cr-setup.md`, `cr-help.md`, `cr-health.md` and the `quokka-cr` skill are in the global commands and skills folders.
3. **Logins**, per the project's systems (`identity-and-gates.md`): `gh auth status`, `acli jira auth status`, and Bitbucket for Bitbucket repos. Show the login name, never a token.
4. **Each repo role** in the project file (QuokkaGuide: `app` and `web`; INS: `lg-android`, `lg-ios`, `connect`):
   - clone path saved, and the folder exists
   - a remote matches the role's `id` (`setup.md` step 2), and the saved `remote` name still points at it
   - `refs/remotes/<remote>/<default>` exists locally (no fetch)
   - each `gitignoredFiles` entry exists in the `secretsFrom` clone (`test -e`), and git still ignores it. For a file, `git check-ignore -q <path>`. For a folder entry (ends in `/`), `git check-ignore` on the folder gives false alarms: check instead that `git ls-files <dir>` is empty and `git ls-files --others --ignored --exclude-standard <dir>` lists its files
   - `.codegraph/` present (info only)
   - gate commands are real, not the project file's placeholders
5. **Devices**, if any repo is mobile:
   - Android: the saved serial starts with `emulator-`. Say whether `adb devices` lists it now. Not running is a warning, not a failure.
   - iOS: the saved UDID appears in `xcrun simctl list devices available`.
6. **Environment:** `JAVA_HOME` exists and `"$JAVA_HOME/bin/java" -version` reports 17 (or the repo's version) for Android/KMP repos. For web repos, `node -v` matches the repo's `.nvmrc` or `engines`.
7. **Codex:** the plugin's `codex-companion.mjs` exists (`build.md` §Review path) and `codex-companion.mjs setup` reports ready. Missing means reviews fall back to Claude.

Report one table per project: check, status (`ok`, `warn`, `missing`), and the fix. Fixes point at `/quokka:cr-setup <slug>` for anything setup owns, or at the exact login command. End with the most important fix as the next command, or `All set. Next: /quokka:cr` when nothing is missing.

## Local setup (project file exists, local file missing or incomplete)

When another sub-command finds the local file incomplete, it asks only for what that sub-command needs, and suggests `/quokka:cr-setup` to do the rest. `new`/`detail`/`design`/`approve` need nothing local. `handoff` needs nothing local. `build` and `close` need the repos it touches.

1. **Repo clones.** For each role needed, ask for the clone path. Offer any folder under the dev's source directory whose remote matches.
2. **Identity check for each clone.** Run `git -C <path> remote -v`. Normalise every fetch URL to `provider:owner/repo`:
   - `git@github.com:owner/repo.git`, `https://github.com/owner/repo(.git)`, `ssh://git@github.com/owner/repo` give `github:owner/repo`
   - the same forms on `bitbucket.org` give `bitbucket:owner/repo`
   - compare case-insensitively
   - an SSH host alias (`git@bitbucket.org-quokkapps:owner/repo`) counts as its real host: resolve it with `ssh -G <alias> | grep '^hostname'`
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
4. Sign-off: none (default), or the roles who sign off on Confluence, in order.
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
