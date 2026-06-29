#!/usr/bin/env bash
# Background worker for the Quokka SessionEnd knowledge-base summary.
# Args: $1 = transcript .jsonl path, $2 = knowledge-base output dir.
#
# Extracts the user/assistant text from the transcript, asks a headless
# `claude -p` to (a) decide if the session is worth recording and (b) produce a
# self-contained HTML summary, then writes <date>_<title>.html. Never prompts,
# never blocks — failures are silent (logged to stdout, captured by dispatcher).

set -uo pipefail

transcript_path="${1:-}"
kb_dir="${2:-}"
[ -f "$transcript_path" ] || exit 0
[ -d "$kb_dir" ] || exit 0

# Detached processes can inherit a minimal PATH; make sure our tools resolve.
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
command -v jq >/dev/null 2>&1 || exit 0
command -v claude >/dev/null 2>&1 || { echo "$(date) claude not found on PATH"; exit 0; }

# Flatten the transcript to plain "ROLE: text" lines, dropping tool calls/results.
convo="$(jq -r '
  (.message // empty) as $m
  | select($m.role == "user" or $m.role == "assistant")
  | ($m.role | ascii_upcase) as $role
  | (if ($m.content | type) == "string" then $m.content
     else ([$m.content[]? | select(.type == "text") | .text] | join("\n")) end) as $t
  | select(($t | length) > 0)
  | "\($role): \($t)"
' "$transcript_path" 2>/dev/null)"

[ -n "$convo" ] || exit 0

# Cheap pre-filter: skip trivial sessions before spending any tokens.
assistant_turns="$(printf '%s\n' "$convo" | grep -c '^ASSISTANT:')"
char_count="${#convo}"
if [ "$assistant_turns" -lt 2 ] || [ "$char_count" -lt 600 ]; then
  echo "$(date) skipping trivial session (turns=$assistant_turns chars=$char_count)"
  exit 0
fi

read -r -d '' instructions <<'PROMPT'
You are a senior engineer writing an entry for a TEAM ENGINEERING KNOWLEDGE BASE
that records the decisions developers make while pair-programming with an AI.

Below is the text of one Claude Code session. Decide whether it is worth preserving.

WORTH PRESERVING if it contains any of: a non-trivial technical decision, a
design/architecture choice and its rationale, a tradeoff that was weighed, a
root-cause diagnosis, a tooling/workflow change, or a meaningful artifact
(a ticket created, a config change, a migration plan, a non-obvious fix).

NOT worth preserving if it is: a trivial question, a one-off lookup, chit-chat,
an empty/aborted session, or routine edits with no decisions.

OUTPUT FORMAT (strict — no code fences, no preamble):
- If NOT worth preserving, output exactly: SKIP
- Otherwise:
    Line 1: TITLE: <short-kebab-case-title, 3-7 words>
    Then a blank line.
    Then a COMPLETE self-contained HTML5 document (<!DOCTYPE html> ... </html>)
    written for a teammate who was not present. Include these sections:
      - Overview (1-2 sentences)
      - Key Decisions (each with its rationale / why)
      - Core Ideas / Approach
      - Outputs & Artifacts (files changed, tickets, commands, configs)
      - Open Follow-ups (only if any)
    Use clean minimal inline CSS. Be concrete and faithful to the transcript —
    never invent facts. Put the human-readable title inside an <h1>.

=== SESSION TRANSCRIPT ===
PROMPT

payload="$instructions
$convo"

out="$(printf '%s' "$payload" | CLAUDE_KB_SUMMARY_GUARD=1 claude -p --model haiku 2>>"${TMPDIR:-/tmp}/quokka-knowledge.log")"

[ -n "$out" ] || { echo "$(date) empty model output"; exit 0; }

first_line="$(printf '%s\n' "$out" | sed -n '1p')"
case "$first_line" in
  SKIP|SKIP[!A-Za-z0-9]*)
    echo "$(date) model judged session not worth recording"
    exit 0
    ;;
esac

# Extract title from the first line; slugify for the filename.
title="$(printf '%s' "$first_line" | sed -E 's/^[[:space:]]*TITLE:[[:space:]]*//I')"
slug="$(printf '%s' "$title" \
  | tr '[:upper:]' '[:lower:]' \
  | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//' \
  | cut -c1-60)"
[ -n "$slug" ] || slug="session"

# Body is everything after the title line (leading blank lines are harmless).
html="$(printf '%s\n' "$out" | sed '1d')"
case "$html" in
  *"<html"*|*"<!DOCTYPE"*|*"<!doctype"*) : ;;
  *) echo "$(date) output did not look like HTML; aborting"; exit 0 ;;
esac

date_prefix="$(date +%F)"
out_file="$kb_dir/${date_prefix}_${slug}.html"
i=2
while [ -e "$out_file" ]; do
  out_file="$kb_dir/${date_prefix}_${slug}-${i}.html"
  i=$((i + 1))
done

printf '%s\n' "$html" > "$out_file"
echo "$(date) wrote $out_file"
