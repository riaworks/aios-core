#!/bin/bash
# SessionStart hook — Plan/Apply model (ADR D3)
# Story: AGF-4 — Activation Foundation
#
# Collects: git info, project status, active agent
# Persists env vars via $CLAUDE_ENV_FILE (only available in SessionStart)
# Returns additionalContext via hookSpecificOutput JSON on stdout
#
# Exit codes: 0 = success, 2 = block (with stderr message)
# Time budget: < 10 seconds (Claude Code limit is 600s)

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
LAST_COMMIT=$(git log -1 --format="%h %s" 2>/dev/null || echo "no commits")
ACTIVE_AGENT=$(cat "$CLAUDE_PROJECT_DIR/.claude/agent-memory/.active-agent" 2>/dev/null || echo "none")

# Count active stories using ls for Windows bash compatibility
ACTIVE_STORIES=$(ls "$CLAUDE_PROJECT_DIR"/docs/stories/epics/*/story-*.md 2>/dev/null | wc -l | tr -d ' ')
if [ -z "$ACTIVE_STORIES" ]; then
  ACTIVE_STORIES=0
fi

# Persist env vars for subsequent Bash commands in this session
if [ -n "$CLAUDE_ENV_FILE" ]; then
  echo "export AIOS_BRANCH=${BRANCH}" >> "$CLAUDE_ENV_FILE"
  echo "export AIOS_ACTIVE_AGENT=${ACTIVE_AGENT}" >> "$CLAUDE_ENV_FILE"
  echo "export AIOS_ACTIVE_STORIES=${ACTIVE_STORIES}" >> "$CLAUDE_ENV_FILE"
  echo "export AIOS_ACTIVATION_LEVEL=3" >> "$CLAUDE_ENV_FILE"
fi

# Escape values for JSON safety (remove newlines, escape quotes)
BRANCH_SAFE=$(echo "$BRANCH" | tr -d '\n' | sed 's/"/\\"/g')
COMMIT_SAFE=$(echo "$LAST_COMMIT" | tr -d '\n' | sed 's/"/\\"/g')
AGENT_SAFE=$(echo "$ACTIVE_AGENT" | tr -d '\n' | sed 's/"/\\"/g')

# Return additionalContext for Claude (stdout JSON)
cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "AIOS Session: branch=${BRANCH_SAFE} | commit=${COMMIT_SAFE} | agent=${AGENT_SAFE} | stories=${ACTIVE_STORIES} | level=3"
  }
}
EOF

exit 0
