# Story IDE-SKILL-1: Agent-Native + Skill-First Migration Plan (Execution)

## Metadata
- **Story ID:** IDE-SKILL-1
- **Epic:** IDE Skill-First Migration
- **Status:** Completed (Waves 0-5 Completed)
- **Priority:** P1 - High
- **Type:** Migration Execution
- **Executor:** @devops (Gage)
- **Created:** 2026-02-17
- **Updated:** 2026-02-17

---

## Decision Statement

**Pedro's direction is approved with one technical constraint:**

1. Source of truth remains in `.aios-core/development/agents/*.md` and `.aios-core/development/tasks/*.md`.
2. `ide-sync` and related generators become the abstraction layer per platform.
3. Migration is **dual-run first** (new artifacts + existing adapters) with strict parity gates.
4. Platform output must follow what is actually supported by each runtime; unsupported primitives stay as adapters.

---

## Story

**As a** maintainer of AIOS multi-IDE integration,  
**I want** a phased execution plan to migrate from command/rules-heavy outputs to native agents + reusable skills,  
**so that** AIOS keeps one canonical source and installs the right artifact type per platform with zero activation regressions.

---

## Scope

### IN
- Rewritten execution plan with wave-by-wave rollout
- Compatibility matrix for agent/skill/task/command primitives by platform
- Strategy for `tasks -> skills` and `agents -> native agents` where supported
- Exact operational checklist and quality gates
- Rollback rules per wave

### OUT
- Implementing migration code in this story
- Removing legacy adapters in this story
- Forcing unsupported primitives into platforms that do not support them natively

---

## Current Baseline (Repository Facts)

1. Canonical agent source: `.aios-core/development/agents/*.md` (12 agents).
2. Canonical task source: `.aios-core/development/tasks/*.md` (198 tasks on disk; 156 referenced by agent dependencies).
3. Current `ide-sync` outputs:
   - Claude: `.claude/commands/AIOS/agents/*.md`
   - Gemini rules: `.gemini/rules/AIOS/agents/*.md`
   - Gemini commands: `.gemini/commands/*.toml`
   - Cursor: `.cursor/rules/agents/*.md`
   - AntiGravity: `.antigravity/rules/agents/*.md`
   - GitHub Copilot: `.github/agents/*.md`
4. Current Codex skill pipeline is separate: `.aios-core/infrastructure/scripts/codex-skills-sync/index.js` -> `.codex/skills/aios-*/SKILL.md`.
5. Contract/doc drift exists and must be fixed before cutover:
   - `package.json` version: `4.2.13`
   - default parity contract: `.aios-core/infrastructure/contracts/compatibility/aios-4.0.4.yaml`
   - docs matrix currently references `4.2.11`

---

## Platform Compatibility Matrix (Execution Contract)

| Platform | Native Agents | Native Skills (`SKILL.md`) | Native Commands | AIOS Execution Contract |
|---|---|---|---|---|
| Claude Code | YES | YES | YES (legacy-compatible) | Generate native agents first; keep commands as adapters during migration |
| GitHub Copilot | YES (`.agent.md`) | PARTIAL (prompt/customization model, not AIOS `SKILL.md` contract) | LIMITED | Generate native agents; do not force AIOS skill runtime semantics |
| Codex CLI | NO native multi-agent file contract (uses AGENTS instructions) | YES | YES (`$`/`/skills` UX) | Keep skills-first for activation; adapters remain optional |
| Codex App | Same as Codex CLI contract for repo artifacts | YES | YES | Treat as same pipeline as Codex CLI |
| Gemini CLI | NO native agent persona files | CONDITIONAL (extension/workspace path must be validated per runtime) | YES (`.toml`) | Keep commands as stable adapter; introduce skills in dual-run with validator gate |
| Cursor | PARTIAL (modes/rules) | NO stable AIOS `SKILL.md` runtime contract | YES (slash/modes vary) | Keep rules adapter contract |
| AntiGravity | UNVERIFIED native agent/skill contract in this repo | UNVERIFIED | UNVERIFIED | Keep cursor-style rules adapter contract |
| Windsurf | PARTIAL (rules/modes) | NO stable AIOS `SKILL.md` runtime contract in AIOS today | LIMITED | Out of current runtime contract; evaluate in expansion wave |

**Rule:** if platform primitive is not stable/verified in AIOS runtime, keep adapter output as the compatibility path.

---

## Target Architecture (After Migration)

### 1) Canonical Inputs (No Change)
- Agents: `.aios-core/development/agents/*.md`
- Tasks: `.aios-core/development/tasks/*.md`

### 2) Shared Intermediate Model
- `AgentSpec`: id, metadata, persona, commands, dependencies, source path
- `TaskSpec`: id/name, intent, dependencies, source path, safety flags

### 3) Output Families
- **Native Agent Outputs** (where supported): Claude, GitHub Copilot
- **Agent Skill Outputs**: Codex (required), Claude/Gemini (dual-run path)
- **Task Skill Outputs**: generated from curated task catalog (not all tasks at once)
- **Compatibility Adapters**: Claude commands, Gemini TOML commands, Cursor/AntiGravity rules

### 4) Distribution Strategy
- Build once from canonical model, fan out to platform-specific targets.
- Keep all generated artifacts deterministic (stable ordering + hashable content).

---

## Migration Waves

### Wave 0 - Contract and Baseline Freeze
- **Goal:** Align versions/contracts/docs and freeze a known green baseline.
- **Entry:** current branch compilable.
- **Exit:** parity contract version aligned with `package.json` (dynamic `aios-${VERSION}.yaml`) and docs; baseline gates green.
- **Rollback:** revert contract/docs only.
- **Risk:** Low.

### Wave 1 - Shared Model Extraction (Agents + Tasks)
- **Goal:** Extend parser layer to provide stable `AgentSpec` and `TaskSpec`.
- **Entry:** Wave 0 complete.
- **Exit:** generators consume shared model instead of ad-hoc parsing.
- **Rollback:** restore previous parsers and direct generators.
- **Risk:** Medium.

### Wave 2 - Native Agents Track (Claude + Copilot)
- **Goal:** Generate native agents as first-class outputs.
- **Entry:** Wave 1 complete.
- **Exit:**
  - Claude native agents generated and validated.
  - Copilot native agent format generated and validated.
  - `ideSync` targets in `.aios-core/core-config.yaml` updated for native-agent routing.
  - Legacy Claude commands remain active as adapters.
- **Rollback:** keep legacy command/rules outputs only.
- **Risk:** Medium.

### Wave 3 - Agent Skills Consolidation (Codex First)
- **Goal:** Consolidate agent skill generation in shared pipeline.
- **Entry:** Wave 2 complete.
- **Exit:**
  - Codex skills generated from shared renderer with no behavior drift.
  - Optional Claude/Gemini skill targets added in dual-run mode.
  - Gemini extension manifest kept consistent with generated skills (`packages/gemini-aios-extension/extension.json`).
  - Validators cover command+skill coexistence where applicable.
- **Rollback:** restore legacy per-platform skill generators.
- **Risk:** Medium.

### Wave 4 - Task-to-Skill Rollout (Curated)
- **Goal:** Convert selected high-value tasks into reusable skills.
- **Entry:** Wave 3 complete.
- **Exit:**
  - Task skill catalog defined (allowlist).
  - Task skills generated for Codex + optional compatible targets.
  - No activation noise (catalog must be curated, not full 198-task dump).
- **Rollback:** disable task skill distribution, keep agent skills only.
- **Risk:** High (surface-area expansion).

### Wave 5 - Cutover and Adapter Governance
- **Goal:** Make default guidance "native agents + skills", with adapters as compatibility.
- **Entry:** Wave 4 stable in CI.
- **Exit:** docs/contracts/validators reflect final operating model.
- **Rollback:** revert docs/validator policy only; keep technical outputs unchanged.
- **Risk:** Medium.

## Execution Progress

- [x] Wave 0 completed (contract/docs parity alignment + full gates green)
- [x] Wave 1 completed (shared AgentSpec/TaskSpec model + deterministic ordering + full gates green)
- [x] Wave 2 completed (Claude/Copilot native agents + Claude command adapter coexistence + full gates green)
- [x] Wave 3 completed (Claude/Gemini agent-skills dual-run + Gemini extension manifest alignment + full gates green)
- [x] Wave 4 completed (task-skill catalog + sync/validate pipeline + curated task skills generated + gates green)
- [x] Wave 5 completed (docs/contracts/validators aligned to native+skills defaults + adapters governance explicit + gates green)

---

## Non-Negotiable Safety Rules

1. No wave merge without full gates green.
2. No deletion of adapter outputs during this story.
3. No direct manual edits in generated directories without generator updates.
4. Every migration PR must include rollback notes and validator evidence.
5. Task-to-skill rollout must start with allowlist and usage telemetry, not full task export.

---

## Acceptance Criteria

- [x] **AC1:** Migration plan rewritten with platform-aware execution strategy
- [x] **AC2:** Compatibility matrix includes Claude, Codex (CLI/App), Gemini, Cursor, AntiGravity, Windsurf, Copilot
- [x] **AC3:** Wave plan covers `agents -> native agents` and `tasks -> skills`
- [x] **AC4:** Dual-run and rollback policy explicitly defined
- [x] **AC5:** Operational checklist and quality gates updated
- [x] **AC6:** Story file list updated

---

## Tasks / Subtasks (Planning Deliverable)

- [x] 1. Revalidate repository baseline and real output paths
- [x] 2. Reconcile proposal with platform capability constraints
- [x] 3. Rewrite wave plan for executable migration
- [x] 4. Rewrite operational checklist for runbook execution
- [x] 5. Update story artifacts and change log

---

## Exact File Map by Wave

See: `docs/stories/epics/epic-ide-skill-first/checklist-IDE-SKILL-1-skill-first-cutover.md`

---

## Ownership and Escalation

- **Technical owner:** `@devops`
- **Architecture quality gate:** `@architect`
- **Escalation trigger:** activation regression, validator drift, unsupported primitive forced into runtime
- **Escalation action:** rollback current wave and open corrective follow-up story with RCA

---

## File List

| File | Action | Description |
|------|--------|-------------|
| `docs/stories/epics/epic-ide-skill-first/story-IDE-SKILL-1-migration-waves.md` | EDIT | Rewritten execution plan for agent-native + skill-first migration |
| `docs/stories/epics/epic-ide-skill-first/checklist-IDE-SKILL-1-skill-first-cutover.md` | EDIT | Rewritten operational runbook by wave |
| `.aios-core/infrastructure/contracts/compatibility/aios-4.2.13.yaml` | CREATE | New compatibility contract aligned to package version 4.2.13 |
| `.aios-core/infrastructure/scripts/validate-parity.js` | EDIT | Dynamic default contract resolution (`aios-${VERSION}.yaml`) |
| `.aios-core/infrastructure/scripts/ide-sync/README.md` | EDIT | Added parity contract guidance and validation expectations |
| `docs/ide-integration.md` | EDIT | Updated compatibility references to 4.2.13 contract |
| `docs/pt/ide-integration.md` | EDIT | Updated compatibility references to 4.2.13 contract |
| `docs/es/ide-integration.md` | EDIT | Updated compatibility references to 4.2.13 contract |
| `.aios-core/infrastructure/scripts/ide-sync/agent-parser.js` | EDIT | Deterministic parsing order for agent files |
| `.aios-core/infrastructure/scripts/ide-sync/task-parser.js` | CREATE | New task parser for TaskSpec extraction |
| `.aios-core/infrastructure/scripts/skills-sync/contracts.js` | CREATE | Shared contracts for AgentSpec/TaskSpec normalization |
| `.aios-core/infrastructure/scripts/skills-sync/index.js` | CREATE | Shared pipeline builders and skill plan writer |
| `.aios-core/infrastructure/scripts/skills-sync/renderers/agent-skill.js` | CREATE | Canonical agent skill renderer |
| `.aios-core/infrastructure/scripts/skills-sync/renderers/task-skill.js` | CREATE | Canonical task skill renderer |
| `.aios-core/infrastructure/scripts/codex-skills-sync/index.js` | EDIT | Refactored to consume shared skills-sync pipeline |
| `tests/unit/skills-sync/contracts.test.js` | CREATE | Unit coverage for spec normalization contracts |
| `tests/unit/skills-sync/index.test.js` | CREATE | Deterministic ordering coverage for shared pipeline |
| `tests/unit/ide-sync/task-parser.test.js` | CREATE | Unit coverage for TaskSpec parser behavior |
| `.aios-core/infrastructure/scripts/ide-sync/claude-agents.js` | CREATE | Claude native agent renderer (`.claude/agents/*.md`) |
| `.aios-core/infrastructure/scripts/ide-sync/github-copilot-agents.js` | CREATE | GitHub Copilot native agent renderer (`.github/agents/*.agent.md`) |
| `.aios-core/infrastructure/scripts/ide-sync/index.js` | EDIT | Added native-agent transformer routing and dual-target Claude outputs |
| `.aios-core/core-config.yaml` | EDIT | Registered native Claude/Copilot targets + Claude command adapter target |
| `.aios-core/infrastructure/scripts/validate-claude-integration.js` | EDIT | Enforced coexistence checks for native agents and command adapters, including duplicate native `name` detection |
| `package.json` | EDIT | Added native agent sync scripts (`sync:agents:claude`, `sync:agents:github-copilot`) |
| `tests/ide-sync/transformers.test.js` | EDIT | Coverage for native Claude and Copilot transformers |
| `tests/unit/validate-claude-integration.test.js` | EDIT | Coverage for Claude native+adapter coexistence validation and duplicate-name blocking |
| `.github/agents/*.agent.md` | GENERATE | GitHub Copilot native agent artifacts from canonical source |
| `.github/agents/*.md` | DELETE | Removed legacy non-native Copilot agent markdown files after native `.agent.md` stabilization |
| `.aios-core/infrastructure/scripts/ide-sync/claude-skills.js` | CREATE | Claude agent-skill transformer (`.claude/skills/aios-*/SKILL.md`) |
| `.aios-core/infrastructure/scripts/ide-sync/gemini-skills.js` | CREATE | Gemini agent-skill transformer + extension manifest sync |
| `.aios-core/infrastructure/scripts/ide-sync/validator.js` | EDIT | Recursive validation support for nested `*/SKILL.md` outputs |
| `.aios-core/infrastructure/scripts/validate-gemini-integration.js` | EDIT | Added Gemini skill inventory + extension manifest alignment checks |
| `packages/gemini-aios-extension/extension.json` | EDIT | Skills catalog now generated/aligned with canonical agent set |
| `packages/gemini-aios-extension/skills/aios-*/SKILL.md` | GENERATE | Gemini extension skill artifacts generated from shared renderer |
| `tests/ide-sync/validator.test.js` | EDIT | Coverage for nested markdown discovery used by skill targets |
| `tests/unit/validate-gemini-integration.test.js` | EDIT | Coverage for Gemini skills + extension manifest validation |
| `.aios-core/infrastructure/contracts/task-skill-catalog.yaml` | CREATE | Curated allowlist contract for `tasks -> skills` rollout targets |
| `.aios-core/infrastructure/scripts/task-skills-sync/index.js` | CREATE | Task-skill sync pipeline (catalog-driven, multi-target, prune support) |
| `.aios-core/infrastructure/scripts/task-skills-sync/validate.js` | CREATE | Task-skill validator (source-path, naming, collision, orphan checks) |
| `.aios-core/infrastructure/scripts/codex-skills-sync/validate.js` | EDIT | Allow catalog-listed `aios-task-*` directories in strict Codex validation |
| `.aios-core/infrastructure/contracts/compatibility/aios-4.2.13.yaml` | EDIT | Added `task-skills` to global required parity checks |
| `.aios-core/infrastructure/scripts/validate-parity.js` | EDIT | Added `task-skills` validator execution to parity gates |
| `AGENTS.md` | EDIT | Updated default operating model and task-skill commands for cutover |
| `tests/unit/codex-skills-validate.test.js` | EDIT | Added strict-mode coverage for allowlisted task skills |
| `tests/unit/validate-parity.test.js` | EDIT | Updated parity test contract/check-count for `task-skills` gate |
| `tests/unit/task-skills-sync-index.test.js` | CREATE | Unit tests for catalog-driven task skill sync and prune behavior |
| `tests/unit/task-skills-validate.test.js` | CREATE | Unit tests for task-skill validation pass/fail scenarios |

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-02-17 | @devops (Gage) | Rewrote IDE-SKILL-1 to executable model: native agents where supported, skills where stable, adapters for compatibility |
| 2026-02-17 | @devops (Gage) | Added platform compatibility contract for Codex CLI/App, Gemini, Claude, Cursor, AntiGravity, Windsurf, Copilot |
| 2026-02-17 | @devops (Gage) | Added explicit `tasks -> skills` rollout constraints (allowlist-first) and strengthened rollback policy |
| 2026-02-17 | @devops (Gage) | Executed Wave 0: added `aios-4.2.13` contract, updated parity resolver/docs, and validated full baseline gates |
| 2026-02-17 | @devops (Gage) | Executed Wave 1: added shared AgentSpec/TaskSpec pipeline, migrated Codex skills sync, enforced deterministic ordering, and validated full gates |
| 2026-02-17 | @devops (Gage) | Executed Wave 2: introduced Claude/Copilot native agent renderers, kept Claude command adapters, updated routing/validators/scripts, and validated full gates |
| 2026-02-17 | @devops (Gage) | Executed Wave 3: enabled Claude/Gemini agent-skills dual-run, synced Gemini extension skills manifest, upgraded nested-file validators, and validated full gates |
| 2026-02-17 | @devops (Gage) | Post-review hardening: resolved Claude native-agent naming collisions (`name` uniqueness), added duplicate-name validator coverage, and removed legacy `.github/agents/*.md` files |
