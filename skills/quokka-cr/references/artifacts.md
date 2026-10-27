# Working with artifacts safely

Canvases, docs and the CR list are edited by people while the skill runs. The rule is simple: never publish over a version you have not read.

## Before any artifact write

1. Load the `artifact-design` and `artifact-capabilities` skills when writing a page, as the Artifact tool asks.
2. `read` the artifact by URL right before writing. The header says whether the dev can edit it ("writer") and gives the saved file to build from.
3. Build the change on that file. Add things; never remove or replace someone else's page, board or note.
4. Publish with the same `url`.
5. If the publish is refused because a newer version exists, the refusal hands back the live version. Merge only your own additions into it and publish again.
   - Retry up to 3 times.
   - Then stop and use the manual fallback for that step.

Never pass `force: true`.

## Canvas layout (Claude Design canvases)

| File | Holds |
|---|---|
| `project/canvas.json` | canvas title, pages, and boards per page |
| board files listed under each page | the board HTML/CSS/assets |
| `project/design-system.json` + `manifest.json` (DS artifacts) | DS title and tokens |

- List a canvas's files with `action: "list"`, `scope: "files"`, `url`.
- Read the files you need with `read` + `paths`.
- To retitle, change `title` in `project/canvas.json` and publish.
- Docs are renamed with Claude Docs `update`, patching the project `name` and each tab `name`.

## Copying CR pages into a main canvas

1. Read both canvases' `canvas.json` and file listings.
2. For each page in the CR design for this surface, add a page named `<CR-id> <title>` to the main canvas.
   - If a page whose name is the full CR id followed by a space already exists, adopt it and copy only the boards it lacks. `QG-CR-10 ` must not match `QG-CR-100 …`.
   - **Refresh** (hand-off re-run at a new design revision): the hand-off record holds the hash of every board it copied. For each board in the CR's page:
     - main copy hash equals the recorded hash, and the new revision changed it: replace it with the new version
     - main copy hash differs from the recorded hash: someone edited it on the main canvas. Do not replace it. Stop and ask the dev whether to keep their edit or take the new version.
     - board removed in the new revision: leave the main copy and list it for the dev
   - Never touch pages or boards outside the CR's own page.
3. Copy each board file with the `files` map `{artifact: <CR design url>, path: <published path>}`. Do this server side, without downloading.
   - HTML board documents cannot be copied that way. Read them with `path` and publish them as files.
   - Place copied files under a folder named for the CR id, so they never collide with existing paths.
4. Make sure the surface DS is installed on the main canvas. If it is missing, add it the same way the CR design has it. Never install a second DS on one surface.
5. Publish the main canvas (conditional, as above).
6. Verify: re-read the main canvas and check each copied board's hash against the CR design's. Record each board's path and hash in the hand-off step's `ids`.

**Manual fallback.** After 3 refused publishes, or if a copy fails:
- prepare the pages in a scratch folder
- tell the dev exactly which pages to paste into which canvas
- leave the hand-off at `canvas-copied: manual-pending`
- on re-run, verify by hash and move on

The canvas copy mechanics are new. The first time this runs on a project, try it on a scratch canvas before touching a main canvas.

## Claude Docs (CR detail, QG list)

- Load the docs guide first: `guide` with `["topic.index"]`, then the topics you need (`editing`, `tabs`, `uploads`).
- Create a new doc with `batch` (container `create`) and a skeleton of `pending` blocks, then fill each section.
- Edit with `update` against the version you read.
- Open a new doc for the dev with the Artifact tool's `open`.

## Screenshots into artifacts

Upload images to an artifact's asset store (`publish` with `asset: true`) and reference the returned `url` exactly as given. Never embed passwords, tokens, phone numbers or real people's data in a screenshot. Mask them, or use the test account.
