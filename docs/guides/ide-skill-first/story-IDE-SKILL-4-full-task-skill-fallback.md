# Story IDE-SKILL-4: Full Task-Skills With Post-Install Fallback

## Metadata
- **Story ID:** IDE-SKILL-4
- **Epic:** IDE Skill-First Migration
- **Status:** Completed
- **Priority:** P1 - High
- **Type:** Reliability / Installer Hardening
- **Executor:** @devops (Gage)
- **Created:** 2026-02-17
- **Updated:** 2026-02-17

---

## Story

**As a** maintainer of AIOS installation flows,
**I want** automatic full task-skill generation with deterministic fallback ownership,
**so that** users can install once and later enable additional IDEs/CLIs (e.g. Antigravity) through DevOps without manual catalog edits.

---

## Decision

1. Promote `scope=full` as default behavior for task-skill sync/validate.
2. Keep `scope=catalog` available as explicit legacy mode.
3. Add explicit fallback agent resolution (`--fallback-agent`, default `master`).
4. Parse declared task ownership (`agent`, `Owner Agent`, `**Agent:**`) and normalize aliases (`github-devops -> devops`) before fallback.
5. Expose terminal commands for full sync/validate and post-install IDE enablement.

---

## Acceptance Criteria

- [x] **AC1:** `task-skills-sync` supports `--scope full` and generates skills for all tasks in `.aios-core/development/tasks`.
- [x] **AC2:** `task-skills-sync` supports deterministic fallback owner via `--fallback-agent`.
- [x] **AC3:** Agent ownership extraction supports frontmatter + markdown labels and normalizes `github-devops` alias.
- [x] **AC4:** `validate:task-skills` supports `--scope full` and validates the full output correctly.
- [x] **AC5:** Codex strict validator accepts source-derived task-skill IDs (not only catalog allowlist IDs).
- [x] **AC6:** Package scripts expose full default and catalog legacy commands for terminal use.
- [x] **AC7:** Agent instructions document post-install IDE/CLI activation commands (`sync:ide:<target>`).

---

## File List

| File | Action | Description |
|------|--------|-------------|
| `.aios-core/infrastructure/scripts/task-skills-sync/index.js` | EDIT | Added `scope=full`, fallback-agent support, ownership extraction, alias normalization |
| `.aios-core/infrastructure/scripts/task-skills-sync/validate.js` | EDIT | Added full-scope validation path with same fallback/ownership logic |
| `.aios-core/infrastructure/scripts/codex-skills-sync/validate.js` | EDIT | Strict mode now allows source-derived task-skill IDs |
| `package.json` | EDIT | Added `sync:skills:tasks:full` and `validate:task-skills:full` |
| `tests/unit/task-skills-sync-index.test.js` | EDIT | Added tests for full scope, fallback, and alias normalization |
| `tests/unit/task-skills-validate.test.js` | EDIT | Added full-scope validation test |
| `tests/unit/codex-skills-validate.test.js` | EDIT | Added strict-mode test for source-derived task skill ID |
| `AGENTS.md` | EDIT | Added full task-skill commands + post-install IDE/CLI activation commands |
| `.aios-core/infrastructure/scripts/ide-sync/README.md` | EDIT | Added full task-skill command usage and post-install IDE activation examples |

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-02-17 | @devops (Gage) | Implemented full task-skill mode with fallback ownership and post-install IDE activation guidance |
