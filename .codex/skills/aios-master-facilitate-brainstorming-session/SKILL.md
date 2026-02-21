---
name: aios-master-facilitate-brainstorming-session
description: "To conduct a structured brainstorming session with multiple AI agents (and optionally human participants) to generate, categorize, and prioritize ideas for features, solutions,..."
owner: "master"
intent: "aios-task-workflow"
source: ".aios-core/development/tasks/facilitate-brainstorming-session.md"
---

# AIOS Task Skill: Facilitate Brainstorming Session

## Agent Context
1. Load `.aios-core/development/agents/aios-master/aios-master.md` before this task.
2. Adopt the owner agent persona (`@master`) for the entire execution.
3. Only then execute the task workflow below.

## Source of Truth
- Load `.aios-core/development/tasks/facilitate-brainstorming-session.md`.
- Follow the task workflow exactly as written.

## Execution Protocol
1. Read the task fully before execution.
2. Respect pre-conditions, post-conditions, and acceptance criteria.
3. Use only declared tools/scripts and canonical project paths.
4. Record assumptions explicitly when context is missing.

## Interaction Rules
- Execute non-interactive flow unless blocked by missing context.

## Guardrails
- Do not invent requirements outside the task definition.
- Keep outputs aligned with the active story/epic scope.
- Escalate when constitutional or quality gates would be violated.
