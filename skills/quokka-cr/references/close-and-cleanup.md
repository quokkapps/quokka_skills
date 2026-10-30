# Close and cleanup

## Close

`close <CR-id>` marks a CR Done. It never deletes anything.

1. Work out the required repo roles from the approved detail ("Repos touched"), or the row's `scope` when the detail was skipped, not from the ledger. An empty ledger, or a role with no PR, means the CR is not done.
2. For each required role, there must be a recorded PR, verified merged through the API:
   - GitHub: `gh pr view <url> --json state,mergedAt`
   - Bitbucket: the PR API state is `MERGED`
3. For every surface, check that the main canvas holds the page `<CR-id> <title>`. Skip this when the design was skipped.
4. **All merged and copied:**
   - Set the row to Done, with PR links, `mergedAt` dates, today's date and `<system>:<login>`.
   - Close each GitHub issue with a comment linking the PRs (`gh issue close <n> --comment …`). For Jira, move the ticket to Done with `acli jira workitem transition`.
   - For INS, set the Confluence page status to "Shipped" and add the PR links.
5. **Anything open:** keep the row In progress, and list what is still open: each required role with no PR, each unmerged PR, each missing canvas page.

Next after close: nothing for this CR. Show the next command for the oldest open CR, if any.

## Cleanup

`cleanup` deletes CR design canvases whose pages already live in the main canvases. It is meant for Tam, run now and then.

The Claude account is shared, so the skill cannot restrict who runs it.
1. Say at the start that this command is meant for Tam.
2. Record the runner's `<system>:<login>` on every row it touches.

**Deletion is permanent.** The link stops working for everyone, and it cannot be undone. CR detail docs, tickets and Confluence pages are never deleted.

Steps:
1. **List candidates.** Every Done CR whose design artifact still exists.
2. **Verify each CR.** Every board file in each CR design page must match the main canvas copy byte for byte (sha256), and the surface DS must be installed there. Any mismatch drops that CR from the batch. Report why.
3. **Archive.**
   - Export the CR design's files to `~/.quokka/cr/archive/<CR-id>/`, using Artifact `read` with `paths` and `out_dir`.
   - Check the file count and hashes.
   - Record the path on the row (`archive`).
4. **Repoint references** so they link to the main canvas page instead of the CR design:
   - the ticket(s)
   - PR descriptions, where editable
   - the INS Confluence page
5. **Warn and confirm, one CR at a time.** Show the CR, its design URL, the archive path and the repointed references. Then say:

   > Deleting `<design name>` is permanent. The link will stop working for everyone and cannot be undone. Type `delete <CR-id>` to delete it, or anything else to skip.

   Delete only on that exact text. Never accept a bulk yes, "all", or a confirmation given for another CR.
6. **Delete** with Artifact `action: "delete"`, `url`. Then note the deletion on the row.

End with a summary: deleted, skipped (and why), and archive paths.
