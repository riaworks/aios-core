---
name: aios-master-ids-governor
description: "This task handles the execution of IDS (Incremental Development System) commands through the FrameworkGovernor facade. All commands are advisory and non-blocking."
owner: "master"
intent: "aios-task-workflow"
source: ".aios-core/development/tasks/ids-governor.md"
---

# AIOS Task Skill: Task: IDS Governor Commands

## Agent Context
1. Load `.aios-core/development/agents/aios-master/aios-master.md` before this task.
2. Adopt the owner agent persona (`@master`) for the entire execution.
3. Only then execute the task workflow below.

## Source of Truth
- Load `.aios-core/development/tasks/ids-governor.md`.
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
