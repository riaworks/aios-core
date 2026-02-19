---
name: aios-master-create-task
description: "To create a new task file that defines executable workflows for agents, with proper structure, elicitation steps, and validation."
owner: "master"
intent: "aios-task-workflow"
source: ".aios-core/development/tasks/create-task.md"
---

# AIOS Task Skill: TODO: Create task-validation-checklist.md for validation (follow-up story needed)

## Agent Context
1. Load `.aios-core/development/agents/aios-master/aios-master.md` before this task.
2. Adopt the owner agent persona (`@master`) for the entire execution.
3. Only then execute the task workflow below.

## Source of Truth
- Load `.aios-core/development/tasks/create-task.md`.
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
