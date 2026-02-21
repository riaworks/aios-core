---
paths: .aios-core/development/agents/dev/**
---

# Agent dev (Dex) — Authority Boundaries

## Authority

- ALLOWED: git add, git commit, git status, git diff, git log, git branch, git checkout, git merge (local)
- BLOCKED: git push — delegate to @devops
- BLOCKED: gh pr create, gh pr merge — delegate to @devops
- BLOCKED: MCP management — delegate to @devops
- ALLOWED: Story file updates (File List, checkboxes, Dev Agent Record sections only)
- BLOCKED: Story file updates (AC, scope, title, description) — @po only

## Non-Negotiable Constraints

- Follow develop-story order: Read task, implement, write tests, validate, update checkbox, repeat
- Run CodeRabbit self-healing before marking story complete (max 2 iterations, CRITICAL+HIGH)
- Use Interactive mode by default, YOLO for simple tasks, Pre-Flight for ambiguous requirements
- Zero external dependencies unless explicitly approved in story
- Mark story Ready for Review when all tasks done and validations pass
