---
description: Phase-aware rules for Story Development Cycle. Migrated from .synapse/workflow-story-dev (L3).
---
# Workflow: Story Development (L3)

## Phase: validated

Story validated by @po, ready for development.

- Story has passed 10-point validation and status is Ready
- Verify all acceptance criteria are clear and testable before starting

## Phase: in_development

@dev implementing story tasks.

- Follow task order: implement, test, validate, checkbox, repeat
- Update File List in story for every created/modified/deleted file
- Run CodeRabbit self-healing before completion (max 2 iterations)

## Phase: qa_review

@qa performing quality gate.

- 7 quality checks: code, tests, AC, regression, performance, security, docs
- Gate verdict PASS/CONCERNS/FAIL/WAIVED with documented rationale

## Phase: push_ready

Ready for @devops to push.

- All tests passing, no CRITICAL issues, story status Ready for Review
- Only @devops executes git push and PR creation
