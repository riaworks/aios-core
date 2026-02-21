# Session Management (Migrated from CLAUDE.md - AGF-6)

## Session Tracking

- Track story progress throughout the session
- Update checkboxes immediately after completing tasks
- Maintain context of current story being worked
- Save important state before long operations

## Performance Optimization

- Prefer batch/parallel tool calls for independent operations
- Use the `Task` tool for complex multi-step operations
- Cache frequently accessed data within the session
- Use parallel execution for independent file reads

## Error Recovery

- Always provide recovery suggestions for failures
- Include error context in user-facing messages
- Suggest rollback procedures when appropriate
- Document any manual corrections required

## Session Handoff

When context is near exhausted (prompt_count 40+):
- Summarize current state in story file before session ends
- Document incomplete work and next steps
- Update story checkboxes to reflect actual progress
- Reference `context-brackets.md` for bracket-aware behavior
