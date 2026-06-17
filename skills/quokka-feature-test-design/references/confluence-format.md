# Confluence Output (optional)

Only run if the dev opts in. The local `docs/test-plans/<slug>.md` is always the source of truth.

## Tools
The Atlassian MCP tools are deferred — load them first:
`ToolSearch("select:mcp__claude_ai_Atlassian__getJiraIssue,mcp__claude_ai_Atlassian__createConfluencePage,mcp__claude_ai_Atlassian__getConfluenceSpaces,mcp__claude_ai_Atlassian__getAccessibleAtlassianResources")`
If ToolSearch returns nothing (MCP not connected), tell the dev Confluence sync is unavailable and stop — the `.md` stands.

## Procedure
1. `getAccessibleAtlassianResources` → cloudId.
2. If an epic key was given, `getJiraIssue` to read its title and find/confirm the target space; otherwise ask the dev for the space key (default: the team test-plans space).
3. Build the page body from the test-plan markdown: title `Test Plan: <Feature>`, the summary, the interview checklist, the **MUST-TEST 20%** table, the Extended table, and the skipped list. Convert each markdown table to a Confluence table (Storage/ADF as the MCP expects); keep the Must-Test section visually first and distinct.
4. `createConfluencePage` (or update if a page with that title exists under the parent) with the epic page or space as parent. Link back to the epic.
5. Return the page URL to the dev.

## Notes
- Do not invent a space or parent — confirm with the dev if ambiguous.
- Keep the column order identical to the local template.
- Creating/updating a Confluence page is an outward-facing action — confirm before publishing.
