---
description: Phase-aware rules for Architecture Review workflow. Migrated from .synapse/workflow-arch-review (L3).
---
# Workflow: Architecture Review (L3)

## Phase: impact_analysis

@architect analyzing change impact.

- Analyze blast radius of proposed architectural changes
- Document affected systems, interfaces, and dependencies

## Phase: qa_review

@qa validating architecture compliance.

- Verify compliance with Constitution and coding standards
- Check for breaking changes and backward compatibility

## Phase: implementation

@dev executing architectural changes.

- Follow architecture decisions exactly as documented
- Validate against original impact analysis after changes
