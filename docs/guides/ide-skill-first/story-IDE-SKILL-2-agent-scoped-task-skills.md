# Story IDE-SKILL-2: Agent-Scoped Task Skill Naming

## Metadata
- **Story ID:** IDE-SKILL-2
- **Epic:** IDE Skill-First Migration
- **Status:** Completed
- **Priority:** P2 - Medium
- **Type:** Enhancement
- **Executor:** @devops (Gage)
- **Created:** 2026-02-17
- **Updated:** 2026-02-17

---

## Decision Statement

Task skill IDs must carry the owning agent's identity so that users browsing the IDE skill picker can immediately see which agent handles the task — without needing to open the skill file.

---

## Story

**As a** developer using AIOS task skills in an IDE,
**I want** task skill IDs to follow the pattern `aios-{agent}-{task-id}` instead of `aios-task-{task-id}`,
**so that** I know at a glance which agent owns the skill and can invoke it with confidence.

---

## Current State

IDE-SKILL-1 (Wave 4) introduced task skills with the naming convention:

```
aios-task-{task-id}
```

Examples generated today:
- `aios-task-create-doc`
- `aios-task-create-worktree`
- `aios-task-execute-checklist`

This naming is agent-agnostic. The user sees a list of `aios-task-*` skills with no indication of which agent will handle the invocation.

The agent-task mapping already exists: every agent's `.md` source file declares its tasks under `dependencies.tasks`. The pipeline does not yet use this information when naming skills.

---

## Target State

Task skills named with the owning agent prefix:

```
aios-{agent}-{task-id}
```

Concrete examples:

| Current | Target | Owning Agent |
|---------|--------|--------------|
| `aios-task-create-doc` | `aios-po-create-doc` | `@po` |
| `aios-task-create-worktree` | `aios-devops-create-worktree` | `@devops` |
| `aios-task-execute-checklist` | `aios-qa-execute-checklist` | `@qa` |
| `aios-task-correct-course` | `aios-dev-correct-course` | `@dev` |
| `aios-task-create-next-story` | `aios-po-create-next-story` | `@po` |
| `aios-task-list-worktrees` | `aios-devops-list-worktrees` | `@devops` |

The skill content body and invocation behavior are unchanged — only the directory name (skill ID) changes.

---

## Edge Case: Shared Tasks

Several tasks appear in multiple agents' `dependencies.tasks` (e.g., `correct-course.md` is referenced by `@dev`, `@po`, and others).

**Resolution strategy (choose one before implementation):**

| Option | Behavior | Trade-off |
|--------|----------|-----------|
| **A - Primary owner** | Assign a single canonical agent per task (defined in catalog or first agent in sorted order). One skill emitted. | Simple, no duplication. Catalog needs a `primary_agent` field per entry. |
| **B - Duplicate per agent** | Emit one skill per (agent, task) pair that references the task. E.g., `aios-dev-correct-course` and `aios-po-correct-course`. | More skills in picker; both invocations are valid. |
| **C - Catalog explicit** | `task-skill-catalog.yaml` declares `agent` per allowlist entry. No inference. Explicit and auditable. | Requires catalog update for every new allowlisted task. |

**[AUTO-DECISION] Shared task resolution -> Option C (catalog explicit)** (reason: the catalog is already the authoritative allowlist; adding `agent` per entry is the least-surprising extension and avoids runtime inference bugs).

---

## Technical Scope

### Files to Change

**Core naming change:**

1. `getTaskSkillId(taskId)` in `.aios-core/infrastructure/scripts/skills-sync/renderers/task-skill.js`
   - Current: `aios-task-${id}`
   - Target: `aios-${agent}-${id}` (agent must be passed as second parameter)

2. Call sites of `getTaskSkillId` in `.aios-core/infrastructure/scripts/skills-sync/index.js`
   - `buildTaskSkillPlan()` must forward agent info from the enriched task spec or catalog entry.

**Catalog extension:**

3. `.aios-core/infrastructure/contracts/task-skill-catalog.yaml`
   - Add `agent:` field to each allowlist entry (e.g., `agent: po`).
   - This is the single source of truth for ownership.

**Sync pipeline:**

4. `.aios-core/infrastructure/scripts/task-skills-sync/index.js`
   - Pass `agent` from catalog entry through to `buildTaskSkillPlan()`.

**Validators:**

5. `.aios-core/infrastructure/scripts/task-skills-sync/validate.js`
   - Update naming regex from `^aios-task-` to `^aios-[a-z]+-` (or stricter: enumerate valid agent IDs).
   - Validate that the agent prefix in the skill ID matches a known agent slug.

6. `.aios-core/infrastructure/scripts/codex-skills-sync/validate.js`
   - Update allowlisted pattern to accept `aios-{agent}-*` instead of `aios-task-*`.

**Parity contract:**

7. `.aios-core/infrastructure/contracts/compatibility/aios-4.2.13.yaml`
   - Update task-skills section to reflect new naming convention.

**Renderers (content body):**

8. `.aios-core/infrastructure/scripts/skills-sync/renderers/task-skill.js`
   - Skill content body: emit `name: aios-{agent}-{task-id}` in frontmatter.

**Tests:**

9. `tests/unit/task-skills-sync-index.test.js` — update expected skill IDs in all assertions.
10. `tests/unit/task-skills-validate.test.js` — update naming validation pass/fail cases.
11. `tests/unit/codex-skills-validate.test.js` — update allowlisted pattern expectations.

**Generated artifacts (re-run sync after code changes):**

12. `.codex/skills/aios-*/SKILL.md` — rename directories from `aios-task-*` to `aios-{agent}-*`.
13. `.claude/skills/aios-*/SKILL.md` — same rename.

---

## Out of Scope

- Changes to agent skill naming (`aios-{agent}` for agent skills is already correct).
- Adding new tasks to the catalog allowlist.
- Changing skill content body structure.
- Gemini task skills (catalog target currently `enabled: false`).

---

## Acceptance Criteria

- [x] **AC1:** `task-skill-catalog.yaml` has an `agent:` field for every allowlist entry, with valid agent slugs matching the 12 canonical agents.
- [x] **AC2:** `getTaskSkillId()` accepts agent as a parameter and returns `aios-{agent}-{task-id}`.
- [x] **AC3:** Task skill sync pipeline passes agent info from catalog through to the renderer; generated directories are named `aios-{agent}-*`.
- [x] **AC4:** Old `aios-task-*` directories are pruned from all targets during sync run (prune flag already exists in pipeline).
- [x] **AC5:** Validator accepts `aios-{agent}-*` names and rejects any remaining `aios-task-*` names.
- [x] **AC6:** All existing tests updated and passing; no new test failures introduced.
- [x] **AC7:** `npm run lint` and `npm run typecheck` clean on changed files.
- [x] **AC8:** Parity contract updated to reference new naming convention.

---

## Tasks / Subtasks

- [x] 1. Add `agent:` field to all 13 entries in `task-skill-catalog.yaml`; resolve shared-task ownership per Option C
- [x] 2. Update `getTaskSkillId()` signature to accept `(taskId, agent)` and emit `aios-{agent}-${taskId}`
- [x] 3. Thread `agent` from catalog entry through `buildTaskSkillPlan()` and `buildTaskSkillContent()`
- [x] 4. Update `task-skills-sync/index.js` to pass `agent` from catalog to skill plan builder
- [x] 5. Update validators (`task-skills-sync/validate.js`, `codex-skills-sync/validate.js`) for new naming pattern
- [x] 6. Update parity contract `aios-4.2.13.yaml` task-skills section
- [x] 7. Re-run sync for all enabled targets (codex, claude); verify generated directories renamed
- [x] 8. Update all affected tests

---

## File List (Estimated)

| File | Action | Description |
|------|--------|-------------|
| `.aios-core/infrastructure/contracts/task-skill-catalog.yaml` | EDIT | Add `agent:` field per allowlist entry |
| `.aios-core/infrastructure/scripts/skills-sync/renderers/task-skill.js` | EDIT | `getTaskSkillId(taskId, agent)` emits `aios-{agent}-{taskId}` |
| `.aios-core/infrastructure/scripts/skills-sync/index.js` | EDIT | Forward `agent` from catalog entry through `buildTaskSkillPlan()` |
| `.aios-core/infrastructure/scripts/task-skills-sync/index.js` | EDIT | Pass `agent` field from catalog entries to skill plan builder |
| `.aios-core/infrastructure/scripts/task-skills-sync/validate.js` | EDIT | Validator accepts `aios-{agent}-*`, rejects `aios-task-*` |
| `.aios-core/infrastructure/scripts/codex-skills-sync/validate.js` | EDIT | Update allowlisted pattern from `aios-task-*` to `aios-{agent}-*` |
| `.aios-core/infrastructure/scripts/validate-paths.js` | EDIT | Detect task skills with `aios-{agent}-*` naming convention |
| `.aios-core/infrastructure/contracts/compatibility/aios-4.2.13.yaml` | EDIT | Update task-skills naming convention in parity contract |
| `tests/unit/skills-sync/index.test.js` | EDIT | Update deterministic task skill plan IDs with agent-scoped naming |
| `tests/unit/task-skills-sync-index.test.js` | EDIT | Update expected skill IDs to `aios-{agent}-*` |
| `tests/unit/task-skills-validate.test.js` | EDIT | Update naming validation pass/fail cases |
| `tests/unit/codex-skills-validate.test.js` | EDIT | Update allowlisted pattern expectations |
| `tests/unit/validate-paths.test.js` | EDIT | Update task skill fixture path to `aios-{agent}-*` |
| `.codex/skills/aios-*/SKILL.md` | REGENERATE | Renamed from `aios-task-*` to `aios-{agent}-*` via sync run |
| `.claude/skills/aios-*/SKILL.md` | REGENERATE | Renamed from `aios-task-*` to `aios-{agent}-*` via sync run |

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-02-17 | @dev (Dex) | Created IDE-SKILL-2 as follow-up to IDE-SKILL-1 Wave 4 task skill naming |
| 2026-02-17 | @devops (Gage) | Executed IDE-SKILL-2 with Option C: catalog `agent` ownership, new `aios-{agent}-{task}` IDs, validator hardening, tests updated, and task-skill prune/migration completed |
