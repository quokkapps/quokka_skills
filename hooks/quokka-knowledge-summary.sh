#!/usr/bin/env bash
# Quokka SessionEnd hook dispatcher.
# Reads the hook JSON payload on stdin, then detaches a background worker that
# decides whether this session is worth documenting and, if so, writes an HTML
# summary to <project>/knowledge-base/. Returns immediately so it never blocks
# the session from closing.
#
# Installed by quokka_skills and wired into .claude/settings.json under
# hooks.SessionEnd.

set -uo pipefail

# Recursion guard: the worker spawns a headless `claude -p` to write the
# summary; that nested session also fires SessionEnd -> this script. Bail when
# we are already inside a summary run.
if [ -n "${CLAUDE_KB_SUMMARY_GUARD:-}" ]; then
  exit 0
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

input="$(cat)"

command -v jq >/dev/null 2>&1 || exit 0

transcript_path="$(printf '%s' "$input" | jq -r '.transcript_path // empty' 2>/dev/null)"
project_dir="${CLAUDE_PROJECT_DIR:-$(printf '%s' "$input" | jq -r '.cwd // empty' 2>/dev/null)}"

[ -n "$transcript_path" ] || exit 0
[ -f "$transcript_path" ] || exit 0
[ -n "$project_dir" ] || exit 0

kb_dir="$project_dir/knowledge-base"
mkdir -p "$kb_dir" 2>/dev/null || exit 0

log="${TMPDIR:-/tmp}/quokka-knowledge.log"

# Detach the heavy work (transcript extraction + headless claude call).
nohup bash "$script_dir/quokka-knowledge-worker.sh" "$transcript_path" "$kb_dir" \
  </dev/null >>"$log" 2>&1 &
disown 2>/dev/null || true

exit 0
