---
name: aios-master-setup-design-system
description: "Initialize design system structure for greenfield or brownfield projects. Load tokens from Brad's .state.yaml or manual input, configure Tailwind v4 (@theme), bootstrap Shadcn u..."
owner: "master"
intent: "aios-task-workflow"
source: ".aios-core/development/tasks/setup-design-system.md"
---

# AIOS Task Skill: Setup Design System Structure

## Agent Context
1. Load `.aios-core/development/agents/aios-master/aios-master.md` before this task.
2. Adopt the owner agent persona (`@master`) for the entire execution.
3. Only then execute the task workflow below.

## Source of Truth
- Load `.aios-core/development/tasks/setup-design-system.md`.
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
