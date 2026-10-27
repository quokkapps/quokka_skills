# The CR list

The CR list is shared state. Every dev reads it, and every gate, hand-off step and close writes to it. Two adapters store the same fields.

## Row fields

| Field | Example |
|---|---|
| `id` | `QG-CR-22` |
| `title` | Choose a region on first launch |
| `status` | Proposed, Approved, Detailed, Designed, Handed-off, In progress, Done, Rejected |
| `problem`, `why` | one or two sentences each |
| `surfaces` | `app, web-traveller` (surface keys from the project file) |
| `gates.row/detail/design` | `{state, rev, by, name, date}` |
| `artifacts` | `{detail, design}` URLs |
| `handoff` | `{state, detailRev, designRev, steps: [{step, startedAt, doneAt, ids}]}` |
| `tickets` | issue/ticket URLs per repo role |
| `confluence` | page URL (INS) |
| `ledger` | per repo role: `{required, branch, gate, pr, mergedAt}` |
| `archive` | local archive path after cleanup |
| `log` | short dated lines, newest last |

## Next id

Read every row. Take the highest number for the prefix and add 1. Pad it to `idWidth`. Also check the main canvases for page names carrying a higher id, since the canvas numbering is canonical. Never reuse an id, even a Rejected one.

Neither adapter can reserve an id atomically, so two devs running `new` at once could pick the same one. Guard it:
1. Allocate the id right before the write, never earlier.
2. `claude-doc`: if the update is refused because the doc moved, re-read and **allocate again** before retrying. Never retry with the old id.
3. `html-db`: create the row under a collision-safe doc id, `<CR-id>.<epoch-ms>`, never under the bare CR id. Two concurrent creates then land as two documents, and neither overwrites the other.
4. After writing, re-read the list. If another row (a different doc id, or a different table row) has the same CR id, whoever proposed it, the row created later is renumbered. Only ever renumber the row you just wrote, and tell the dev the new id.

## Adapter: `claude-doc` (QG)

The list is a Claude Docs doc with one table. Columns: `ID | Title | Status | Surfaces | Row | Detail | Design | Hand-off | Tickets | PRs`. Each gate cell reads like `approved @login r12 2026-10-27`, `stale`, or `pending`.

Any field that does not fit a cell goes in a section `## <CR-id>` under the table, as a fenced `json` block holding the full row record. That block is the source of truth. The table is the human view, regenerated from the block on every write.

Writing:
1. Load the docs guide once per session (`guide` with `topic.index`, then `topic.editing`).
2. `read` the doc and take its version.
3. Make the edit with `update` on that version, changing only this CR's table row and its section.
4. If the version moved, re-read, re-apply only this CR's change, and retry up to 3 times. Then stop and report.

Legacy rows: the QG list predates this flow, and its rows have no JSON block. Treat each one as a legacy record (see below). Add the block the first time the skill writes to that row.

## Adapter: `html-db` (INS)

The list is an HTML artifact with an artifact database. Load `ArtifactData` (ToolSearch `select:ArtifactData`). The collection is in `crList.collection` (`decisions`). There is one document per CR. Its data is the row record, and the record's `id` field holds the CR id. The doc id is `<CR-id>.<epoch-ms>` (see Next id), so find a CR with `query` on `id`, not by doc id.

Writing:
1. `query` for the CR's document and take its doc id.
2. `update` (merge) only the fields this step changes. Use `set` only when creating a row.
3. Use `batch` when writing more than two documents.

The page renders from the db, so never republish the page to change a row. If the page does not show a new field, tell Tam rather than editing the page.

## Legacy CRs

Rows that existed before this flow (QG-CR-01 to QG-CR-21, INS-CR-001 to INS-CR-044) are legacy records.

- Backfill links to existing tickets and artifacts when found.
- Assume nothing else. All gates start `pending`.
- A legacy CR cannot authorise a build until its detail and design are approved under this flow, which binds the approvals to revisions.

## Bare `/quokka:cr`

Show every open CR (not Done or Rejected) as a table: id, title, status, gate states, and the next command for that row (`next-command.md`). Then show Done CRs as a count only.
