---
name: aios-master-run-workflow
description: "To provide guided workflow automation with file-based state persistence. Tracks workflow progress across sessions, suggests next concrete actions, and maintains continuity. NOT..."
owner: "master"
intent: "aios-task-workflow"
source: ".aios-core/development/tasks/run-workflow.md"
---

# AIOS Task Skill: Run Workflow Task

## Agent Context
1. Load `.aios-core/development/agents/aios-master/aios-master.md` before this task.
2. Adopt the owner agent persona (`@master`) for the entire execution.
3. Only then execute the task workflow below.

## Source of Truth
- Load `.aios-core/development/tasks/run-workflow.md`.
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
