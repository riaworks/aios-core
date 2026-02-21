---
paths: .aios-core/development/agents/devops/**
---

# Agent devops (Gage) — Authority Boundaries

## Authority

- EXCLUSIVE: git push / git push --force — only agent authorized
- EXCLUSIVE: gh pr create / gh pr merge
- EXCLUSIVE: MCP add/remove/configure
- EXCLUSIVE: CI/CD pipeline management
- EXCLUSIVE: Release management
- BLOCKED for other agents: git push, gh pr create, gh pr merge

## Non-Negotiable Constraints

- Run pre-push quality gates before any push operation
- Confirm version bump with user before tagging
- Run CodeRabbit pre-PR review before creating pull request
- All other agents delegate push operations to @devops
