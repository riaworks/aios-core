# Orion (AIOS Master) Agent Memory

## Key Patterns

### Framework Architecture
- AIOS follows CLI First > Observability Second > UI Third hierarchy
- Constitution at `.aios-core/constitution.md` has 6 articles (I-VI), Articles I-II are NON-NEGOTIABLE
- `core-config.yaml` merges L1-L5 config layers; L5 (user-config.yaml) has highest priority
- IDE sync pipeline outputs to 8 targets: claude-code, codex, gemini, cursor, antigravity, github-copilot, claude-skills, gemini-skills

### Agent System
- 12 core agents, each in `.aios-core/development/agents/{id}/{id}.md`
- Activation via IDE-generated `.claude/agents/{id}.md` — reads source, MEMORY.md, agent-context.md
- Agent parser does 2-pass scan: subdirectories first (Pass 1), flat files as fallback (Pass 2)
- Memory links: `.claude/agent-memory/{name}/` symlinks to `.aios-core/development/agents/{name}/`
- Agent skills (persona activation) vs Task skills (workflow execution) vs Documents (direct .md reference)

### Task System
- Tasks are the primary unit, not agents (Task-First principle)
- Tasks define WHAT to do; Executors (agents, workers, clones, humans) are interchangeable
- Workflows = tasks connected, not agents connected
- ~150+ tasks in `.aios-core/development/tasks/`

### IDS (Identity & Decision System)
- Entity registry at `.aios-core/data/entity-registry.yaml`
- Verification gates G1-G4 in `.aios-core/core/ids/gates/`
- Self-healing registry via `RegistryHealer` at `.aios-core/core/ids/registry-healer.js`
- `bin/aios-ids.js` is shared CLI entry point for IDS operations

## Key File Locations
- Constitution: `.aios-core/constitution.md`
- Core config: `.aios-core/core-config.yaml`
- Entity registry: `.aios-core/data/entity-registry.yaml`
- Install manifest: `.aios-core/install-manifest.yaml`
- Agent parser: `.aios-core/infrastructure/scripts/ide-sync/agent-parser.js`
- IDE sync index: `.aios-core/infrastructure/scripts/ide-sync/index.js`
- Agent context: `.aios-core/development/agents/{id}/agent-context.md`
- Quality gates: `.aios-core/core/quality-gates/`
- Permissions: `.aios-core/core/permissions/`

## Domain Knowledge
- This agent has access to ALL 31 tasks, 9 workflows, 14 templates, 6 checklists
- When creating new components, always validate against agent-v3-schema.json
- `*validate-agents` runs cross-agent validation
- `*analyze-framework` provides structural analysis of the AIOS codebase

## Gotchas
- Pre-existing lint errors (279 errors, 860 warnings) exist in the codebase
- squads/mmos-squad/ has 6 failing test suites due to missing clickup module
- tests/core/orchestration/ has 2 failing suites (greenfield-handler, terminal-spawner)
- `jest.clearAllMocks()` does NOT reset `mockImplementation()` - only clears call history
