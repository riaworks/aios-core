# Checklist IDE-SKILL-1: Agent-Native + Skill-First Cutover Runbook

## Pre-Flight (Mandatory Before Wave 0)

- [x] Capture rollback reference (tag or commit SHA) -- baseline SHA: `6eaa7aa9d027`
- [x] `npm run sync:ide:check` green
- [x] `npm run validate:parity` green
- [x] `npm run validate:claude-integration` green
- [x] `npm run validate:codex-integration` green
- [x] `npm run validate:gemini-integration` green
- [x] `npm run validate:codex-skills` green
- [x] `npm run validate:paths` green
- [x] `npm run lint` green
- [x] `npm run typecheck` green
- [x] `npm test` green

---

## Wave 0 - Contract and Baseline Freeze

### Files

| File | Action |
|------|--------|
| `.aios-core/infrastructure/contracts/compatibility/aios-${VERSION}.yaml` | CREATE (`${VERSION}` from `package.json`, current: `4.2.13`) |
| `.aios-core/infrastructure/scripts/validate-parity.js` | EDIT |
| `docs/ide-integration.md` | EDIT |
| `docs/pt/ide-integration.md` | EDIT |
| `docs/es/ide-integration.md` | EDIT |
| `.aios-core/infrastructure/scripts/ide-sync/README.md` | EDIT |

### Execution

- [x] Create compatibility contract matching `package.json` version (`${VERSION}`, current: `4.2.13`)
- [x] Update `validate-parity.js` default contract path
- [x] Align EN/PT/ES IDE docs to same contract/version
- [x] Validate docs matrix claims vs contract checks
- [x] Run wave gates

### Exit Criteria

- [x] No version drift between package/contract/docs
- [x] Parity validator reports zero contract violations

---

## Wave 1 - Shared Model Extraction (Agents + Tasks)

### Files

| File | Action |
|------|--------|
| `.aios-core/infrastructure/scripts/ide-sync/agent-parser.js` | EDIT |
| `.aios-core/infrastructure/scripts/ide-sync/task-parser.js` | CREATE |
| `.aios-core/infrastructure/scripts/skills-sync/index.js` | CREATE |
| `.aios-core/infrastructure/scripts/skills-sync/renderers/agent-skill.js` | CREATE |
| `.aios-core/infrastructure/scripts/skills-sync/renderers/task-skill.js` | CREATE |
| `.aios-core/infrastructure/scripts/skills-sync/contracts.js` | CREATE |

### Execution

- [x] Normalize `AgentSpec` contract (id, metadata, commands, dependencies, source)
- [x] Create `TaskSpec` parser from `.aios-core/development/tasks/*.md`
- [x] Add shared renderer contracts for agent-skill and task-skill
- [x] Ensure deterministic ordering and stable output hashes
- [x] Add/update unit tests for parser contracts
- [x] Run wave gates

### Exit Criteria

- [x] Shared model consumed by at least one existing generator
- [x] No output drift in existing generated artifacts (except expected metadata normalization)

---

## Wave 2 - Native Agents Track (Claude + GitHub Copilot)

### Files

| File | Action |
|------|--------|
| `.aios-core/infrastructure/scripts/ide-sync/claude-agents.js` | CREATE |
| `.aios-core/infrastructure/scripts/ide-sync/github-copilot-agents.js` | CREATE |
| `.aios-core/infrastructure/scripts/ide-sync/index.js` | EDIT |
| `.aios-core/core-config.yaml` | EDIT (register native agent target path/routing) |
| `.aios-core/infrastructure/scripts/validate-claude-integration.js` | EDIT |
| `.aios-core/infrastructure/scripts/validate-codex-integration.js` | EDIT (ensure no regressions from new routing) |
| `package.json` | EDIT (add `sync:agents:claude`, `sync:agents:github-copilot`) |
| `.claude/agents/aios-*.md` | GENERATE |
| `.github/agents/*.agent.md` | GENERATE |
| `.claude/commands/AIOS/agents/*.md` | KEEP (adapter layer) |

### Execution

- [x] Generate native Claude agents from canonical source
- [x] Generate Copilot native agent format
- [x] Update `.aios-core/core-config.yaml` to route Claude/Copilot to native-agent outputs
- [x] Keep Claude command path as compatibility wrapper
- [x] Extend validators to assert native-agents + adapters coexistence
- [x] Run wave gates

### Exit Criteria

- [x] Claude native agents and command adapters both valid
- [x] Copilot agent format generated without breaking current integration checks

---

## Wave 3 - Agent Skills Consolidation (Codex First)

### Files

| File | Action |
|------|--------|
| `.aios-core/infrastructure/scripts/codex-skills-sync/index.js` | EDIT (reuse shared renderer) |
| `.aios-core/infrastructure/scripts/codex-skills-sync/validate.js` | EDIT |
| `.aios-core/infrastructure/scripts/ide-sync/claude-skills.js` | CREATE |
| `.aios-core/infrastructure/scripts/ide-sync/gemini-skills.js` | CREATE |
| `.aios-core/core-config.yaml` | EDIT (register skill targets where enabled) |
| `.aios-core/infrastructure/scripts/validate-claude-integration.js` | EDIT |
| `.aios-core/infrastructure/scripts/validate-gemini-integration.js` | EDIT |
| `package.json` | EDIT (add `sync:skills:claude`, optional `sync:skills:gemini`) |
| `.codex/skills/aios-*/SKILL.md` | GENERATE/VERIFY |
| `.claude/skills/aios-*/SKILL.md` | GENERATE |
| `packages/gemini-aios-extension/skills/aios-*/SKILL.md` | GENERATE (dual-run) |
| `packages/gemini-aios-extension/extension.json` | EDIT (skills map/path consistency) |

### Execution

- [x] Migrate Codex skills generation to shared renderer with zero behavior drift
- [x] Add Claude agent-skill generation in dual-run mode
- [x] Add Gemini extension skill generation in dual-run mode (commands remain stable adapter)
- [x] Keep `packages/gemini-aios-extension/extension.json` aligned with generated skill paths/ids
- [x] Update `.aios-core/core-config.yaml` with enabled skill targets
- [x] Validate counts: canonical agents == generated agent-skills per enabled target
- [x] Run wave gates

### Exit Criteria

- [x] Codex skill activation unchanged
- [x] Gemini command launchers still working while extension skills are present
- [x] Claude command adapters still working while skills are present

---

## Wave 4 - Task-to-Skill Rollout (Allowlist First)

### Files

| File | Action |
|------|--------|
| `.aios-core/infrastructure/contracts/task-skill-catalog.yaml` | CREATE |
| `.aios-core/infrastructure/scripts/task-skills-sync/index.js` | CREATE |
| `.aios-core/infrastructure/scripts/task-skills-sync/validate.js` | CREATE |
| `package.json` | EDIT (add `sync:skills:tasks`, `validate:task-skills`) |
| `.codex/skills/aios-task-*/SKILL.md` | GENERATE |
| `.claude/skills/aios-task-*/SKILL.md` | GENERATE (optional by catalog flag) |
| `packages/gemini-aios-extension/skills/tasks/*.md` | GENERATE (optional by catalog flag) |

### Execution

- [x] Define task-skill catalog (start with curated subset, not all tasks)
- [x] Generate task skills from catalog only
- [x] Validate each task skill source path points to real task file
- [x] Validate naming convention and no collision with agent skills
- [x] Run wave gates (plus `validate:task-skills`)

### Exit Criteria

- [x] Task skills are discoverable and do not overload activation UX
- [x] No regressions in existing agent activation flows

---

## Wave 5 - Cutover Policy and Adapter Governance

### Files

| File | Action |
|------|--------|
| `AGENTS.md` | EDIT |
| `docs/ide-integration.md` | EDIT |
| `docs/pt/ide-integration.md` | EDIT |
| `docs/es/ide-integration.md` | EDIT |
| `.aios-core/infrastructure/contracts/compatibility/aios-4.2.13.yaml` | EDIT |
| `.aios-core/infrastructure/scripts/validate-parity.js` | EDIT |

### Execution

- [x] Set default guidance to native agents + skills by platform capability
- [x] Explicitly mark commands/rules as compatibility adapters where applicable
- [x] Keep adapters active; do not delete in this story
- [x] Update parity checks to enforce new documented defaults
- [x] Run wave gates

### Exit Criteria

- [x] Docs, contracts and validators aligned to same operating model
- [x] Migration can proceed to implementation stories without ambiguity

---

## Wave Gates (Run on Every Wave)

- [x] `npm run sync:ide:check`
- [x] `npm run validate:parity`
- [x] `npm run validate:claude-sync`
- [x] `npm run validate:claude-integration`
- [x] `npm run validate:codex-sync`
- [x] `npm run validate:codex-integration`
- [x] `npm run validate:gemini-sync`
- [x] `npm run validate:gemini-integration`
- [x] `npm run validate:codex-skills`
- [x] `npm run validate:task-skills`
- [x] `npm run validate:paths`
- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm test`
- [x] Run wave-specific scripts introduced in the current wave (only after script creation)

---

## Stop Criteria (Immediate Rollback)

- [ ] Any blocking validator fails post-wave
- [ ] Agent activation path regresses in Claude, Codex, or Gemini
- [ ] Generated outputs drift from canonical semantics
- [ ] Docs/contract/validator mismatch reappears

---

## Rollback Checklist

- [ ] Revert only files from current wave
- [ ] Re-run parity + integration checks
- [ ] Confirm previous baseline restored
- [ ] Record rollback reason and trigger in story changelog
