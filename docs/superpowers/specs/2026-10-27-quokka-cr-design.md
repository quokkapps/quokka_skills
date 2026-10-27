# `/quokka:cr`: change-request flow from idea to shipped code

**Status:** draft for Tam's approval (rev 2, after Codex adversarial review) · **Date:** 2026-10-27 · **Owner:** Tam Phan

## 1. Intent and why

The QuokkaGuide 2.0 move to Compose Multiplatform worked because of a strict flow:
1. Design came first, on Claude Design canvases.
2. Every gate needed Tam's approval.
3. Builders worked test-first, and Codex reviewed every task.
4. Proof screenshots, a decision log and a UAT list for anything agents could not test.
5. Nothing was pushed or merged without a human.

That flow lives only in Tam's head and in one session's memory. This skill packages it so Tam and the dev team can run it on any project (mobile app, web, or both) from any starting folder.

The non-negotiable rule: **nothing is built without an approved change request (CR) and an approved design on a Claude Design canvas.** When someone says "I want to build X", the skill opens a CR. It never writes code.

## 2. Goals, non-goals, anti-goals

**Goals**
- One command family, `/quokka:cr`, shipped in `quokkapps/quokka_skills`, installed by the existing installer (`npx --yes github:quokkapps/quokka_skills`, or `/quokka:update`).
- The same gate flow for every project; only project settings differ.
- QuokkaGuide and INS (LifeGuardian + Connect) come pre-configured; any new project is set up through a one-time interview.
- Every built CR ends with proof screenshots under `screenshot/<CR-id>/` and local branches ready for PRs.

**Non-goals**
- Code is never pushed and never merged without the dev's explicit yes. The skill never merges.
- No new design tooling. It uses the Claude Design canvases and Claude Docs the team already uses.
- No replacement for project-specific build knowledge. It reads that from the project files.

**Anti-goals (failure even if it works)**
- Code written before the CR detail and design are approved, or against a revision other than the approved one.
- Two design systems mixed on one surface.
- An approved design that never reaches its `*-Design-Main` canvas, which leaves the main canvas stale.
- Someone's hand edit on a main canvas lost to the skill's publish.
- Duplicate tickets, Confluence pages or canvas pages from a retried step.
- A CR design deleted by accident, or deleted before its content is safely on the main canvas and archived.
- A builder agent that stalls silently. This happened 3 times during the 2.0 build.

## 3. Naming and registry (decided by Tam, 2026-10-27)

**CR IDs:** QuokkaGuide `QG-CR-NN` (two digits). INS `INS-CR-NNN` (three digits). Any new project picks its own prefix at setup.

**Artifacts per project:**

| Kind | Name pattern | Artifact type |
|---|---|---|
| CR list | `<PFX>-CR-List` | QG: Claude Docs doc. INS: HTML page with db collection `decisions` |
| CR detail | `<PFX>-CR-<n>-Detail <title>` | Claude Docs doc |
| CR design | `<PFX>-CR-<n>-Design <title>` | Design canvas, one page per surface |
| Main canvas | `<PFX>-<Surface>-Design-Main` | Design canvas |
| Design system | `<PFX>-<Surface>-DS` | Design System |

**Current registry** (all artifacts were renamed to this convention on 2026-10-27):

| Project | Surface | Main canvas | DS |
|---|---|---|---|
| QG | App | QG-App-Design-Main `H9HjEH7CqNz6Z1TzeSdTWs` | QG-App-DS `FfSAS4Mr9XTYwfsJk2h1MZ` |
| QG | Web Traveller | QG-Web-Traveller-Design-Main `R6q3bvzKYS8BzGcNPZvxfm` | QG-Web-Traveller-DS `2E1SubJDwLg7ViUi5Y12Vi` |
| QG | Web Creator | QG-Web-Creator-Design-Main `CYBqCU4Fz59fvYR9awTYoc` | QG-Web-CreatorAdmin-DS `A6wHLGBMfPrNBXihSDeP8j` |
| QG | Web Admin | QG-Web-Admin-Design-Main `3G4ovxctadtgRsw8dpCis6` | QG-Web-CreatorAdmin-DS |
| INS | LifeGuardian app | INS-App-LG-Design-Main `JpETRFw1xoxtXBoPUV3g5c` | INS-App-LG-DS `9ma4DoiwamN8ZHp5EHG6eV` |
| INS | Connect app | INS-App-LGC-Design-Main `JFBSE3236gVPkq9bgyM9NT` | INS-App-LGC-DS: not built yet, so Connect uses INS-App-LG-DS |

CR lists: QG-CR-List `21KMJ1QGKrxfZi8oGuQgfv`, INS-CR-List `CrgDfc6S451eizNafyYrrp`. All URLs are `https://claude.ai/artifact/<id>`.

## 4. Identity: shared Claude account, personal tool accounts

All devs share **one Claude account**, so the Claude login never identifies anyone. Each dev does have their **own** GitHub, Bitbucket and Atlassian (Jira/Confluence) account.

**Who ran a command:** at the start of every run, the skill reads the dev's identity from their own tool login:
- `gh api user --jq .login` for GitHub
- the Bitbucket CLI or app-password user for Bitbucket
- `acli jira auth status` for Atlassian

That login is recorded on every gate event and ledger entry. If no tool login is available, the skill refuses to record approvals.

**What counts as approval:**
- **QG gates (row, detail, design):** an approval recorded by the skill under the dev's tool login, plus an optional display name. This is an **attestation** by a known account, not a cryptographic proof. The list shows it as "approved by @login".
- **INS design gate (named approvers, decided by Tam 2026-10-27):** `ins.json` lists the approvers as Atlassian account ids: the Manager, then Josh. Their approval must come from **their own Atlassian accounts on the Confluence page** (section 7), in that order. The skill reads it back through the Confluence API and checks the account ids. A name typed into the skill never satisfies an INS named approval. `/quokka:cr` replaces the `ins-feature-request` skill, which is retired and redirects here.

**Revision binding:** every approval stores the revision it approved:
- detail: the Claude Docs doc `rev`
- design: the canvas version id plus a hash of its board files
- row: the list row's version

When an approved artifact changes later, its approval and every approval downstream of it become **stale**, and the list shows them that way. The skill re-checks the revisions before the hand-off and again before every build. A stale gate blocks both.

## 5. Configuration: shared project file + local machine file

**Shared, shipped in this repo, read-only on a dev machine:** `projects/<slug>.json` (`qg.json`, `ins.json`). It holds:
- prefix, number width, CR list, surfaces with their main canvas and DS, and named approvers if any
- ticket target:
  - QG: GitHub, app issues on `quokkapps/quokkaguide-kmp`, backend/creator/web issues on `quokkapps/quokkaguideweb`, no Confluence
  - INS: Jira project `MA` on theinsgroup.atlassian.net, plus a Confluence page in space `APP` under "Feature Requests"; code on Bitbucket
- **repo roles with a canonical identity:** each role (`app`, `web`, `lg-android`, `lg-ios`, `connect`) maps to `provider:owner/repo`, for example `github:quokkapps/quokkaguide-kmp`. These names hold no URLs, credentials or paths.
- device **rules**, e.g. "Android installs only with `adb -s <emulator>`; never run Gradle `install*`/`connected*` tasks (they reach physical phones and watches)" and "iOS is driven through XCUITest"
- staging package names, and a pointer to the test account (no passwords)
- gate commands per role (unit tests, lint, build), the screenshot test tool, and the review command

**Local, per developer, never committed:** `~/.quokka/cr/<slug>.local.json`, written by the setup step. It holds:
- each repo role mapped to a local clone path. Before the skill copies secrets, builds or pushes, it checks that the clone's remote resolves to that role's canonical `owner/repo`, whatever the dev's own URL form (SSH, HTTPS, mirror). A mismatch stops the run.
- the emulator serial and iOS simulator UDID, picked from `adb devices` / `xcrun simctl list`
- the JDK path, and where git-ignored secrets are copied from (`google-services.json`, keystores, staging assets)

Tam's local file is seeded from today's paths (`/Volumes/TamExtSSD/Documents/SourceCode/...`, `emulator-5554`).

**New project:**
1. Setup writes the new project file **only** to `~/.quokka/cr/projects/local/<slug>.json`.
2. `/quokka:cr share-project <slug>` is a separate, explicit step. It opens a PR adding the file to `quokka_skills` from the dev's GitHub account, and the PR needs Tam's review.

**Precedence:**
- A shipped file wins over a local file with the same slug.
- Setup refuses a slug that collides with a shipped one.
- Once a local project ships, the skill tells the dev to delete the local copy.

## 6. Commands

| Command | Does |
|---|---|
| `/quokka:cr` | Without arguments: run setup if needed, then show this project's CRs with gate states (approved / stale / pending) and what's next. |
| `/quokka:cr new <idea>` | Add a list row (Proposed) with the problem, the why and the surfaces touched. Any "build X" request also lands here. |
| `/quokka:cr detail <CR-id>` | Needs an approved row. Explore the real code and write the CR detail doc: problem, proposal, affected screens and surfaces, repos touched, data/API changes, open questions. |
| `/quokka:cr design <CR-id>` | Needs an approved detail. Build the CR design canvas: one page per surface (App, Web Traveller, Creator, Admin), each on its surface's DS, with notes tying boards back to detail sections. |
| `/quokka:cr approve <CR-id> <gate> [name]` | Record a gate approval under the dev's tool login and the current revision (section 4). Gates: `row`, `detail`, `design`. Approving `design` starts the hand-off. |
| `/quokka:cr handoff <CR-id>` | Resume or re-check a hand-off (section 7). Safe to re-run at any time. |
| `/quokka:cr build <CR-id>` | Implement (section 8). |
| `/quokka:cr close <CR-id>` | Section 9. Never deletes anything. |
| `/quokka:cr cleanup` | Meant for Tam, run occasionally (section 10). |
| `/quokka:cr resume` | Pick up an in-flight build from its ledger after a session dies. |
| `/quokka:cr share-project <slug>` | Propose a locally set-up project to the shared repo. |

**Always suggest the next command (Tam, 2026-10-27).** Every sub-command ends with one line saying what is done and the exact command to run next, worked out from the CR's gate and hand-off state. Examples:
- after `new`: `/quokka:cr approve QG-CR-22 row`
- after the row is approved: `/quokka:cr detail QG-CR-22`
- after `detail`: `/quokka:cr approve QG-CR-22 detail`
- after the design is approved: `/quokka:cr handoff QG-CR-22`
- for INS while sign-off is pending: "waiting for Manager/Josh on <Confluence link>; re-run `/quokka:cr handoff INS-CR-015`"
- after the hand-off: `/quokka:cr build QG-CR-22`
- after `build`: push and PR (asks yes/no), then `/quokka:cr close QG-CR-22` once merged

When something blocks, the line names the blocker and the command that clears it, e.g. a stale design means `/quokka:cr approve QG-CR-22 design`. Bare `/quokka:cr` shows the next command for every open CR.

## 7. Hand-off after design approval: a resumable state machine

The hand-off creates things outside Claude, so it runs as a **state machine recorded in the CR list row**. The row is shared state that every dev can see.

**States, in order:**
1. `canvas-copied`
2. `tickets-drafted`
3. `confluence-created` (INS only)
4. `named-approvals-done` (INS only)
5. `tickets-created`
6. `links-recorded`

**How each step runs:**
- Each step first writes "starting X at revision R" to the row. It then does the step, then writes "done X" with the created ids.
- Before any create, the skill **reconciles**: it searches the target for an existing item tagged with the CR id and revision, and adopts it instead of creating a duplicate. The tag sits in the item's title or a label.
  - GitHub: `gh issue list --search "<CR-id> in:title"` plus a `cr:<CR-id>` label
  - Jira: JQL on summary
  - Confluence: page title
  - canvas: the page id `<cr-id>`
- `build` refuses until the row reads `links-recorded` at a non-stale revision.

**Steps:**
1. **Copy to main.** Each page of the CR design is copied into its matching `*-Design-Main` canvas as page `<CR-id> <title>`, with the DS installed there if it is missing.
   - The publish is conditional. If someone saved the canvas since the skill read it, the platform refuses the publish. The skill then re-reads the canvas, re-applies only its own additions, and retries up to 3 times.
   - After that it stops and switches to the **manual fallback**: it prepares the pages and asks a human to paste them.
   - It never replaces existing pages or boards.
   - The CR design itself stays untouched.
2. **Draft tickets** and show them to the dev, who must confirm. There is one ticket per repo touched (QG app and web are separate GitHub issues, cross-linked). Every body links the CR detail and design at the approved revision.
3. **INS only:**
   - Create the Confluence page in `APP › Feature Requests`, titled `INS-CR-0NN <title>`. It combines the detail text and design screenshots, with the approval tracker (Manager, then Josh, then ticket). Its status is "Pending sign-off".
   - The Manager and Josh approve on that page with their own Atlassian accounts.
   - The skill polls (or is re-run) and moves on only when both approvals are present, in order, from the listed account ids.
4. **Create tickets:** the GitHub issue(s) for QG; the Jira `MA` ticket for INS, linking the Confluence page.
5. **Record links** in the list row.

## 8. `/quokka:cr build`

**Preconditions:**
- the hand-off is `links-recorded`, with no stale gate
- every repo the detail names is mapped locally and passes the identity check

Otherwise the skill stops and names what is missing.

**Per repo touched** (one CR can touch several):
- a fresh worktree on branch `<PFX>-CR-<n>-<slug>`, from that repo's default branch
- the git-ignored files listed in the project file, copied in
- a repo ledger at `.quokka/cr/<CR-id>/` inside the worktree (git-ignored), holding `progress.md`, `decisions.md`, `uat.md` and the review outputs

The CR list row holds the **CR-level ledger**: each repo's branch, gate state, ticket and PR.

**Sizing (the skill's call, stated to the user):**
- **Small**: one surface and roughly one screen or flow. One builder agent works test-first, then the gate, a Codex review loop and screenshots.
- **Large**: anything else. The skill writes a plan (superpowers:writing-plans) with a task queue, then runs one implementer per task serially (never parallel lanes), with tiered gates:
  - per commit: targeted tests
  - per task: module tests
  - before the PR: the full gate

  A CTO-style orchestrator logs every call in `decisions.md`.

**Rules baked into every builder brief:**
- Implement the approved revision of the detail and design, and nothing else. If the design is silent, decide, log the decision, and keep going.
- Write the test first; record the red run.
- Device rules from the project file go in verbatim.
- Untestable checks become UAT rows in `uat.md` for a human: real sign-in, store sandboxes, inboxes, real devices. Never spend agent time on them; never drop them silently.
- **Anti-stall:**
  - never use `nohup`, a trailing `&`, `disown`, `setsid`, `rm -rf` or heredoc file writers
  - run gates, builds and reviews in the foreground with a 600 s timeout, split into chunks over 9 minutes
  - never end the turn while waiting on a job
  - if a command fails or hangs twice, stop and report
- The orchestrator watches each builder's transcript mtime and acts after about 12 min idle.

**Review:** after each task, Codex review (`codex-companion.mjs review --scope branch`) until clean. P1/P2 findings are always fixed; P3 when cheap, otherwise logged. Fall back to a Claude reviewer only if Codex is unavailable, and say so.

**Proof screenshots:**
- Captured on the configured emulator and simulator for every changed screen, light and dark where the app has themes.
- Saved to `screenshot/<CR-id>/<description>_<platform>.png` under the folder the session started in. If that folder is a git repo, `screenshot/` is added to its `.gitignore` unless the project file says to commit them.

**Finish, per repo:**
1. Run `/simplify`, unless it already ran on this branch after the last code change.
2. Run the full gate.
3. Commit locally.
4. Show the draft PR: title, body linking the ticket, detail, design, screenshots and open UAT rows.
5. Push and open the PR from the dev's own GitHub/Bitbucket account **only when the dev says yes**.
6. Never merge.

## 9. `/quokka:cr close`

The skill closes a CR only when **every** PR in the CR-level ledger is verified merged through the GitHub/Bitbucket API, and every main canvas holds the CR's pages. It then:
- marks the row Done, with PR links, date and the dev's login
- closes the GitHub issue(s), or moves the Jira ticket to Done

A partly merged CR stays "In progress" and the skill lists what is still open.

## 10. `/quokka:cr cleanup`

Meant for Tam. Because the Claude account is shared, the skill cannot restrict who runs it. It states the intent and records the dev's tool login.

1. List every Done CR whose design artifact still exists.
2. **Verify completeness** for each CR: every board file in each page matches the main canvas's copy byte-for-byte (by hash), and the DS is installed there. Any mismatch takes that CR out of the batch, and the report says why.
3. **Archive:** export the CR design's files to `~/.quokka/cr/archive/<CR-id>/` so it can be restored, and record that path on the list row.
4. **Repoint references:** update the ticket(s), PR descriptions where editable, and the INS Confluence page so they link to the main canvas page instead of the CR design.
5. **Warn:** deletion is permanent, the link stops working for everyone, and it cannot be undone.
6. **Delete** only after the user types the confirmation for that CR (`delete QG-CR-13`), one CR at a time, never a bulk yes.

CR detail docs and Confluence pages are never deleted.

## 11. Package layout (in this repo)

```
commands/quokka/cr.md              # thin command: invokes the skill with $ARGUMENTS
skills/quokka-cr/SKILL.md          # the flow above, per sub-command
skills/quokka-cr/references/       # gates and identity, hand-off state machine, canvas copy,
                                   # list adapters, builder brief template, ticket templates
projects/qg.json, projects/ins.json
```

**Packaging changes:**
- Add `projects` to `package.json` `files`.
- Teach `bin/install.js` a **global target**: `~/.claude/commands/quokka/cr.md`, `~/.claude/skills/quokka-cr/` and `~/.quokka/cr/projects/`, because `/quokka:cr` must work from any folder. This sits alongside today's per-project install of the other commands.
- The installer gets its own completeness check (each destination file present and at the package version), plus update and uninstall.
- Upgrading an existing per-project install leaves that install alone and adds the global one.
- Tests cover a packed-package install, a global upgrade, and that `local/` survives an update.

## 12. Calls made while writing this (Claude's, for Tam to check)

- **Which project.** The skill decides in this order:
  1. the prefix in a CR id (`QG-CR-21` means QG)
  2. a `--project <slug>` flag
  3. the current folder's git root matched against the clone paths in `~/.quokka/cr/*.local.json`
  4. otherwise it asks, then remembers the answer in the local file

  When a CR id and a flag disagree, the skill stops. Setup runs only for a project name with no file.
- **Existing CRs are legacy records.** Their ticket links are backfilled, and nothing else is assumed. A legacy CR cannot authorize a build until its detail and design are approved fresh (revision-bound) under this flow. INS CRs start at Proposed, since no decisions are recorded.
- **Canonical repo identity is shared (`provider:owner/repo`).** This replaces the earlier "remotes are private" call. The shared file holds only org/repo names; each dev's URL form and credentials stay local.
- **Canvas mechanics.** Retitling, re-reading and conditional republish of a live `canvas.json` were proven on 2026-10-27, including two refused publishes after concurrent saves. Copying boards between canvases and deleting artifacts are supported by the Artifact tool but untested here. The plan's first task is a spike on a scratch canvas, with the manual-paste fallback ready.

## 13. Builder's calls (left open, settle and note)

- The exact JSON schemas of the project, local, ledger and hand-off state records.
- The two list adapters: a db write for the INS HTML list, Claude Docs table edits for the QG doc list. Both store the same gate, revision and hand-off fields.
- Size thresholds between small and large, within section 8's rule.
- How Confluence approvals are read: the page's approval/workflow data if the space has it, otherwise a signed "Approved" comment from the listed account id.
