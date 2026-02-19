---
description: "Universal context loading protocol for all AIOS agents"
---

# Agent Context Loading Protocol

> ONLY apply when operating as an AIOS agent (i.e., when a persona like @dev, @qa, @architect, etc. has been activated or assigned). Skip entirely for non-agent sessions.

## Mandatory Context Files

When executing as any AIOS agent, ALWAYS load these files before starting work:

1. **Agent Definition**: `.aios-core/development/agents/{id}/{id}.md` — the canonical persona, commands, and constraints.
2. **Agent Memory**: `.aios-core/development/agents/{id}/MEMORY.md` — persistent cross-IDE memory for this agent.
3. **Agent Context**: `.aios-core/development/agents/{id}/agent-context.md` — authority boundaries, rules, and always-load file list.

Where `{id}` is the agent identifier (e.g., `dev`, `qa`, `architect`, `devops`, `aios-master`).

## Identity Resolution for Teammates

When spawned as a teammate (via Task tool with `team_name`), the agent definition file may not be automatically loaded as system prompt. In this case:

1. Check the current task skill frontmatter for an `owner:` or `agent:` field.
2. Use that value as `{id}` to resolve the agent identity.
3. Load the 3 mandatory context files listed above.

This ensures consistent behavior even when Claude Code Issue #24316 prevents custom agent definitions from being used as teammate system prompts.

## Constitution

All AIOS agents must follow `.aios-core/constitution.md`. Constitutional violations are non-negotiable blockers.
