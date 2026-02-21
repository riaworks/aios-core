# Story IDE-SKILL-3: No-Adapter Final Installation Mode

## Metadata
- **Story ID:** IDE-SKILL-3
- **Epic:** IDE Skill-First Migration
- **Status:** Completed
- **Priority:** P1 - High
- **Type:** Migration Hardening
- **Executor:** @devops (Gage)
- **Created:** 2026-02-17
- **Updated:** 2026-02-17

---

## Story

**As a** maintainer validating final installation behavior,
**I want** AIOS installation/sync to run without Claude/Gemini command compatibility adapters,
**so that** runtime behavior reflects the final native-agents + skills operating model.

---

## Decision

1. Disable generation of Claude command adapters (`.claude/commands/AIOS/agents/*`).
2. Disable generation of Gemini command adapters (`.gemini/commands/*.toml`).
3. Enforce no-adapter policy in integration validators.
4. Keep native agents + skills outputs and rules targets intact.

---

## Acceptance Criteria

- [x] **AC1:** `ide-sync` no longer generates Claude command adapter target.
- [x] **AC2:** `ide-sync` no longer generates/validates Gemini command launcher files.
- [x] **AC3:** `validate-claude-integration` fails if adapter files exist.
- [x] **AC4:** `validate-gemini-integration` fails if adapter TOML files exist.
- [x] **AC5:** Existing adapter files removed from repository outputs.
- [x] **AC6:** Docs updated to reflect native agents + skills activation model.
- [x] **AC7:** Quality gates and parity validators pass after cutover.

---

## File List

| File | Action | Description |
|------|--------|-------------|
| `.aios-core/infrastructure/scripts/ide-sync/index.js` | EDIT | Removed Claude command target and Gemini command generation/validation path |
| `.aios-core/core-config.yaml` | EDIT | Removed `claude-code-commands` target from active config |
| `.aios-core/infrastructure/scripts/validate-claude-integration.js` | EDIT | Enforce no command adapters (error if present) |
| `.aios-core/infrastructure/scripts/validate-gemini-integration.js` | EDIT | Enforce no Gemini command adapters (error if present) |
| `.aios-core/infrastructure/scripts/ide-sync/claude-agents.js` | EDIT | Removed adapter compatibility pointer from native agent content |
| `.aios-core/infrastructure/contracts/compatibility/aios-4.2.13.yaml` | EDIT | Added adapter policy flags (`claude/gemini: false`) |
| `tests/unit/validate-claude-integration.test.js` | EDIT | Updated expected behavior for no-adapter mode |
| `tests/unit/validate-gemini-integration.test.js` | EDIT | Updated expected behavior for no-adapter mode |
| `tests/ide-sync/index-validate-filter.test.js` | EDIT | Removed Gemini command sync dependency from validate path |
| `tests/ide-sync/transformers.test.js` | EDIT | Removed expectation of Claude adapter pointer |
| `.claude/commands/AIOS/agents/*.md` | DELETE | Removed Claude command adapter outputs |
| `.gemini/commands/*.toml` | DELETE | Removed Gemini command adapter outputs |
| `docs/ide-integration.md` | EDIT | Updated EN activation model and examples (no adapters, agent-scoped task skills) |
| `docs/pt/ide-integration.md` | EDIT | Updated PT activation model and examples |
| `docs/es/ide-integration.md` | EDIT | Updated ES activation model and examples |
| `.aios-core/infrastructure/scripts/ide-sync/README.md` | EDIT | Removed adapter references from sync docs |

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-02-17 | @devops (Gage) | Executed no-adapter cutover for Claude/Gemini compatibility adapters and aligned validators/docs |
