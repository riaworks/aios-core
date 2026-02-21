---
description: "Universal context loading protocol for all AIOS agents"
---

# Agent Context Loading Protocol

> ONLY apply when operating as an AIOS agent (i.e., when a persona like @dev, @qa, @architect, etc. has been activated or assigned). Skip entirely for non-agent sessions.

## Consolidated Context Architecture (AGF-6)

As of AGF-6, agent context is consolidated into 2 + rules locations:

1. **Agent Definition**: `.claude/agents/{id}.md` — DNA + Enhancement (canonical persona, commands, constraints)
2. **Agent Memory**: `.claude/agent-memory/{id}/MEMORY.md` — persistent cross-IDE memory (auto-injected, 200 lines)
3. **Authority Rules**: `.claude/rules/agent-{id}-authority.md` — authority boundaries (glob-targeted rules)

> **NOTE:** `.aios-core/development/agents/{id}/agent-context.md` is **deprecated since AGF-6**. Those files contain deprecation notices pointing to the new locations above. Do not reference them for new work.

## Mandatory Context Files

When executing as any AIOS agent, ALWAYS load these files before starting work:

1. **Agent Definition**: `.claude/agents/{id}.md` — the canonical persona, commands, and constraints.
2. **Agent Memory**: `.claude/agent-memory/{id}/MEMORY.md` — persistent cross-IDE memory for this agent.
3. **Authority Rules**: `.claude/rules/agent-{id}-authority.md` — authority boundaries and constraints.

Where `{id}` is the agent identifier (e.g., `dev`, `qa`, `architect`, `devops`, `aios-master`).

## AGF-1 Note: Always-Load Files via Skills Frontmatter

Always-load files are defined in the `skills:` frontmatter of each agent definition (`.claude/agents/{id}.md`).
AGF-1 implemented this pattern. Status: Implementation Complete (pending full cross-IDE verification).
If skills frontmatter is not yet operational for a specific IDE, fall back to loading always-load files listed in the agent's MEMORY.md.

## Identity Resolution for Teammates

When spawned as a teammate (via Task tool with `team_name`), the agent definition file may not be automatically loaded as system prompt. In this case:

1. Check the current task skill frontmatter for an `owner:` or `agent:` field.
2. Use that value as `{id}` to resolve the agent identity.
3. Load the 3 mandatory context files listed above.

This ensures consistent behavior even when Claude Code Issue #24316 prevents custom agent definitions from being used as teammate system prompts.

## Constitution

All AIOS agents must follow `.aios-core/constitution.md`. Constitutional violations are non-negotiable blockers.
