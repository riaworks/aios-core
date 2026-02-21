#!/bin/bash
# UserPromptSubmit hook -- SYNAPSE-Lite (ADR D6, D11, D12)
# Input: JSON via stdin with { "prompt": "...", "session_id": "...", "cwd": "..." }
# Output: JSON via stdout with hookSpecificOutput.additionalContext
# NOTE: $CLAUDE_ENV_FILE is NOT available in this event -- use fixed paths
# Story: AGF-5

INPUT=$(cat)

# Parse prompt without jq (not available on Windows Git Bash)
# Pass INPUT as argv[1] to avoid /dev/stdin issues on Windows Git Bash
PROMPT=$(node -e "try{process.stdout.write(JSON.parse(process.argv[1]).prompt||'')}catch(e){}" "$INPUT" 2>/dev/null || echo "")

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
ENV_FILE="$PROJECT_DIR/.claude/agent-memory/.env"
AGENT_FILE="$PROJECT_DIR/.claude/agent-memory/.active-agent"
RULES_DIR="$PROJECT_DIR/.claude/rules"

# --- Read state ---
ACTIVE_AGENT=$(cat "$AGENT_FILE" 2>/dev/null || echo "none")
PROMPT_COUNT=$(grep '^AIOS_PROMPT_COUNT=' "$ENV_FILE" 2>/dev/null | cut -d= -f2 || echo "0")
PROMPT_COUNT=$((PROMPT_COUNT + 1))

# --- Agent switch detection (D6) ---
# Only match @agent at start of prompt to avoid false positives (emails, decorators, @media)
SWITCH_AGENT=""
if echo "$PROMPT" | grep -qE '^@([a-z][a-z0-9-]+)'; then
  NEW_AGENT=$(echo "$PROMPT" | grep -oE '^@([a-z][a-z0-9-]+)' | head -1 | sed 's/@//')
  # Only switch if agent file exists and it's a different agent
  if [ "$NEW_AGENT" != "$ACTIVE_AGENT" ] && [ -f "$PROJECT_DIR/.claude/agents/${NEW_AGENT}.md" ]; then
    SWITCH_AGENT="$NEW_AGENT"
    echo "$NEW_AGENT" > "$AGENT_FILE"
    ACTIVE_AGENT="$NEW_AGENT"
  fi
fi

# --- Bracket estimation (D12) ---
if [ "$PROMPT_COUNT" -lt 10 ]; then
  BRACKET="FRESH"
elif [ "$PROMPT_COUNT" -lt 25 ]; then
  BRACKET="MODERATE"
elif [ "$PROMPT_COUNT" -lt 40 ]; then
  BRACKET="DEPLETED"
else
  BRACKET="CRITICAL"
fi

# --- Build XML injection (D11) ---
XML=""

# Critical: agent context (always if agent active)
if [ "$ACTIVE_AGENT" != "none" ] && [ -f "$PROJECT_DIR/.claude/agents/${ACTIVE_AGENT}.md" ]; then
  # Extract DNA section (between PERSONA DNA and ENHANCEMENT markers)
  IDENTITY=$(sed -n '/PERSONA DNA/,/ENHANCEMENT/{/PERSONA DNA/d;/ENHANCEMENT/d;p;}' \
    "$PROJECT_DIR/.claude/agents/${ACTIVE_AGENT}.md" 2>/dev/null | head -10)
  if [ -n "$IDENTITY" ]; then
    IDENTITY_ESCAPED=$(echo "$IDENTITY" | tr '\n' ' ' | sed 's/"/\\"/g' | sed "s/'/\\'/g")
    XML="${XML}<agent-context priority=\"critical\"><identity>${IDENTITY_ESCAPED}</identity>"
    if [ -n "$SWITCH_AGENT" ]; then
      XML="${XML}<switch>Switched to agent: ${SWITCH_AGENT}</switch>"
    fi
    XML="${XML}</agent-context>"
  fi
fi

# High: session state (always)
BRANCH=$(grep '^AIOS_BRANCH=' "$ENV_FILE" 2>/dev/null | cut -d= -f2 || echo "unknown")
XML="${XML}<session-state priority=\"high\"><branch>${BRANCH}</branch><prompt-count>${PROMPT_COUNT}</prompt-count><bracket>${BRACKET}</bracket></session-state>"

# Medium: keyword rules (sparse -- only when matched)
KEYWORD_XML=""
if [ -d "$RULES_DIR" ]; then
  for RULE_FILE in "$RULES_DIR"/keyword-*.md; do
    [ -f "$RULE_FILE" ] || continue
    # Extract trigger from frontmatter
    TRIGGER=$(grep '^trigger:' "$RULE_FILE" 2>/dev/null | head -1 | sed 's/trigger:[[:space:]]*//' | tr -d '"'"'" | tr '[:upper:]' '[:lower:]')
    if [ -n "$TRIGGER" ] && echo "$PROMPT" | grep -qi "$TRIGGER"; then
      # Read rule content (skip frontmatter)
      RULE_CONTENT=$(sed '1,/^---$/d' "$RULE_FILE" 2>/dev/null | head -5 | tr '\n' ' ' | sed 's/"/\\"/g')
      KEYWORD_XML="${KEYWORD_XML}<rule trigger=\"${TRIGGER}\">${RULE_CONTENT}</rule>"
    fi
  done
fi
if [ -n "$KEYWORD_XML" ]; then
  XML="${XML}<keyword-rules priority=\"medium\">${KEYWORD_XML}</keyword-rules>"
fi

# Low: bracket advice (MODERATE+ only)
if [ "$BRACKET" != "FRESH" ]; then
  XML="${XML}<context-bracket priority=\"low\"><status>${BRACKET}</status>"
  if [ "$BRACKET" = "CRITICAL" ]; then
    XML="${XML}<advice>Session approaching limit. Consider /compact or session handoff.</advice>"
  elif [ "$BRACKET" = "DEPLETED" ]; then
    XML="${XML}<advice>Context depleted. Agent identity being reinforced.</advice>"
  fi
  XML="${XML}</context-bracket>"
fi

# --- Update state (cross-platform, no sed -i) ---
TMPFILE=$(mktemp)
grep -v '^AIOS_PROMPT_COUNT=' "$ENV_FILE" 2>/dev/null > "$TMPFILE" || true
echo "AIOS_PROMPT_COUNT=${PROMPT_COUNT}" >> "$TMPFILE"
mv "$TMPFILE" "$ENV_FILE"

# --- Output (hookSpecificOutput format) ---
# Escape XML for JSON string
XML_ESCAPED=$(echo "$XML" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | tr -d '\n')

printf '{"hookSpecificOutput":{"hookEventName":"UserPromptSubmit","additionalContext":"%s"}}\n' "$XML_ESCAPED"

exit 0
