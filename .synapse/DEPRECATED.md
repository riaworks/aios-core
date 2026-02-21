# SYNAPSE Engine — Deprecated

**Status:** Deprecated since AGF-6 (2026-02-20)
**Replaced by:** SYNAPSE-Lite (4 hooks + `.claude/rules/`)

## What Replaced It

The full SYNAPSE engine (8-layer runtime, `.synapse/` domain files) has been replaced by SYNAPSE-Lite:

| Old (SYNAPSE) | New (SYNAPSE-Lite) |
|--------------|-------------------|
| `.synapse/` domain files | `.claude/rules/` markdown files |
| `synapse-engine.cjs` UserPromptSubmit hook | `user-prompt-submit.sh` |
| UAP (unified-activation-pipeline.js) | `session-start.sh` + agent `.md` |
| Context brackets in SYNAPSE engine | `context-brackets.md` rule |
| L0-L7 layer processing | Rules glob-targeting |

## Active SYNAPSE-Lite Hooks

1. `session-start.sh` — Agent activation report
2. `user-prompt-submit.sh` — Prompt context injection
3. `precompact-session-digest.cjs` — Session digest on compact
4. `stop-quality-gate.sh` — Quality gate on stop

## Rollback Path

This directory is preserved for 1 sprint rollback. If SYNAPSE-Lite has critical issues:
1. Re-register `synapse-engine.cjs` in `.claude/settings.json` UserPromptSubmit
2. Restore UAP invocations in `session-start.sh`
3. Revert `.claude/rules/agent-context-loading.md`

**Will be removed after AGF-7 confirmation.**

---

*Deprecated by AGF-6 — Epic Agent Fidelity*
*ADR: docs/architecture/adr/ADR-AGF-3-OPTIMAL-AGENT-ACTIVATION-ARCHITECTURE.md*
