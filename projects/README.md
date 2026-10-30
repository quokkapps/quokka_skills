# `/quokka:cr` project files

Each project the change-request flow knows about has one file here (`<slug>.json`). These are shared and read-only on a dev machine. The installer copies them to `~/.quokka/cr/projects/`. Never put a path, a clone URL, a password or a token in them.

Machine-specific values go in `~/.quokka/cr/<slug>.local.json`, which `/quokka:cr` writes on first run (see `skills/quokka-cr/references/setup.md`).

## Shared file fields

| Field | Meaning |
|---|---|
| `slug`, `name`, `prefix`, `idWidth` | CR ids are `<prefix>-CR-<n>`, with `n` zero-padded to `idWidth` (QG `QG-CR-07`, INS `INS-CR-007`). |
| `crList` | The CR list artifact. `kind` is `claude-doc` (a Claude Docs table) or `html-db` (an HTML page plus an artifact db `collection`). |
| `surfaces[]` | One per design surface: `key`, `label`, `main` (the `*-Design-Main` canvas), `ds` (its design system), `repos` (repo roles that implement it). |
| `signoff[]` | Roles who approve the CR outside the skill, in order (INS: Manager, Josh). Before the build, the skill asks the dev whether they have approved; a `no` still lets the build start but holds the push and PR. Empty means no question. |
| `tickets` | `system` is `github` (with `byRepo` role to `owner/repo`) or `jira` (`site`, `project`). `label` is the tag used to find existing tickets. |
| `confluence` | `null`, or the space and parent where the combined detail + design page goes. |
| `repos` | Role to canonical `id` (`provider:owner/repo`), the gate commands, the git-ignored files to copy into a fresh worktree, and staging info. |
| `deviceRules[]` | Pasted verbatim into every builder brief. |
| `testAccount` | A pointer only. |
| `screenshots.commit` | Whether `screenshot/` is committed (default false, so it gets git-ignored). |

## Local file (`~/.quokka/cr/<slug>.local.json`)

```json
{
  "repos": { "<role>": { "path": "/abs/clone/path", "remote": "origin" } },
  "devices": { "androidEmulator": "emulator-5554", "iosSimulator": "<udid>" },
  "env": { "JAVA_HOME": "/Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home" },
  "secretsFrom": { "<role>": "/abs/path/of/a/clone/that/has/the/gitignored/files" },
  "knownFolders": ["/abs/folder/that/means/this/project"]
}
```

## New projects

Setup writes a new project to `~/.quokka/cr/projects/local/<slug>.json` only. `/quokka:cr share-project <slug>` opens a PR adding it here. A shipped file wins over a local one with the same slug.
