#!/usr/bin/env bash
# PostToolUse hook: after a PR is opened, remind the agent to log dev pain points.
# PR creation is rare, so this stays silent on every other tool call.
# Matches both `gh pr create` (Bash) and the GitHub MCP create_pull_request tool.
set -euo pipefail

input=$(cat)

# jq is the project's standard for JSON parsing; bail quietly if unavailable.
if ! command -v jq >/dev/null 2>&1; then
  exit 0
fi

tool=$(printf '%s' "$input" | jq -r '.tool_name // empty')
cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // empty')

is_pr=false
if [ "$tool" = "mcp__github__create_pull_request" ]; then
  is_pr=true
elif printf '%s' "$cmd" | grep -Eq 'gh[[:space:]]+pr[[:space:]]+create'; then
  is_pr=true
fi

[ "$is_pr" = true ] || exit 0

reminder="A PR was just opened. Before wrapping up, reflect on this dev cycle and log any pain points - things that wasted tokens, cost time, were unclear, or where tooling fought back - using the log-pain-point skill (writes to the right repo's docs/dev-pain-points.md). Log one entry per distinct pain point. If nothing notable came up, skip it."

jq -nc --arg ctx "$reminder" \
  '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:$ctx}}'
