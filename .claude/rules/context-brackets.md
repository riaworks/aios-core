---
description: Context bracket rules for context window management. Migrated from .synapse/context (L1).
---
# Context Brackets (L1)

Rules for context window management based on prompt count.

## FRESH (prompt_count < 10)

Context is fresh — minimize injected rules to essentials only.

- Avoid redundant context — agent has full conversation history
- Full layer stack available — all domains can inject normally

## MODERATE (prompt_count 10-24)

Standard context level — all layers active at normal priority.

- Monitor token usage — consider summarizing long outputs
- Prefer concise code examples over verbose explanations

## DEPLETED (prompt_count 25-39)

Context depleting — reinforce critical rules and constraints.

- Prefer concise responses — save tokens for essential operations
- Skip optional keyword layers to conserve tokens
- Summarize progress before each action to maintain continuity

## CRITICAL (prompt_count 40+)

CRITICAL: Context nearly exhausted — recommend session handoff.

- Summarize current state for potential new session continuation
- Only inject L0 Constitution and L1 Global rules — skip all other layers
- Document incomplete work in story file before session ends
