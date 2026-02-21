#!/bin/bash
# Stop hook -- Quality gate + session summary (ADR D10)
# Input: JSON via stdin with { "stop_hook_active": bool, "last_assistant_message": "..." }
# Output: JSON via stdout -- {"decision":"block","reason":"..."} to continue, {} to accept stop
# NOTE: $CLAUDE_ENV_FILE is NOT available in this event -- use fixed paths
# CRITICAL: Must check stop_hook_active to prevent infinite loops!
# Story: AGF-5

INPUT=$(cat)
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
ENV_FILE="$PROJECT_DIR/.claude/agent-memory/.env"

# --- INFINITE LOOP GUARD (CRITICAL) ---
# If stop_hook_active is true, we are in a re-entry from a previous block decision.
# Return {} immediately to allow the stop to proceed.
# Use node -e with inline string (avoids /dev/stdin issues on Windows Git Bash)
STOP_ACTIVE=$(node -e "try{var d=JSON.parse(process.argv[1]);process.stdout.write(String(d.stop_hook_active===true))}catch(e){process.stdout.write('false')}" "$INPUT" 2>/dev/null || echo "false")
if [ "$STOP_ACTIVE" = "true" ]; then
  echo '{}'
  exit 0
fi

PROMPT_COUNT=$(grep '^AIOS_PROMPT_COUNT=' "$ENV_FILE" 2>/dev/null | cut -d= -f2 || echo "0")
AGENT=$(cat "$PROJECT_DIR/.claude/agent-memory/.active-agent" 2>/dev/null || echo "none")

# Check if code was modified (git diff --name-only counts changed files)
CHANGED_FILES=$(git -C "$PROJECT_DIR" diff --name-only 2>/dev/null | wc -l | tr -d ' ')

RESULT=""
if [ "$CHANGED_FILES" -gt 0 ]; then
  # "block" = prevent Claude from stopping (tell it to continue and run tests)
  # NOTE: "block" does NOT mean "block the session" -- it means "block the stop request"
  RESULT="{\"decision\": \"block\", \"reason\": \"${CHANGED_FILES} files changed. Consider running tests before ending session.\"}"
else
  RESULT="{}"
fi

# Write session metrics (append to .env using cross-platform approach)
SESSION_END=$(date +%Y-%m-%dT%H:%M:%S 2>/dev/null || date)
TMPFILE=$(mktemp)
grep -v '^AIOS_SESSION_END=' "$ENV_FILE" 2>/dev/null | \
  grep -v '^AIOS_SESSION_PROMPTS=' | \
  grep -v '^AIOS_SESSION_AGENT=' > "$TMPFILE" || true
echo "AIOS_SESSION_END=${SESSION_END}" >> "$TMPFILE"
echo "AIOS_SESSION_PROMPTS=${PROMPT_COUNT}" >> "$TMPFILE"
echo "AIOS_SESSION_AGENT=${AGENT}" >> "$TMPFILE"
mv "$TMPFILE" "$ENV_FILE"

echo "$RESULT"
exit 0
