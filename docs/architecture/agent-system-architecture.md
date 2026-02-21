# Agent System Architecture v2.0

**Version:** 2.0 (AGF-6 — Consolidation)
**Previous:** v1.0 (SYNAPSE engine + UAP + agent-context.md)
**ADR Reference:** `docs/architecture/adr/ADR-AGF-3-OPTIMAL-AGENT-ACTIVATION-ARCHITECTURE.md`

---

## Overview

The AIOS agent system uses **Progressive Enhancement** — leveraging native Claude Code mechanisms
instead of custom infrastructure. The AGF epic (AGF-1 through AGF-6) migrated from ~2000 LOC of
custom pipeline code to ~200 LOC of native hooks + markdown rules.

---

## 1. Progressive Enhancement Architecture (4 Levels)

```
┌─────────────────────────────────────────────────────┐
│  Level 4: Custom Skills (.claude/skills/{id}/)       │
│  Executable workflows, task-specific behaviors       │
├─────────────────────────────────────────────────────┤
│  Level 3: Agent Memory (.claude/agent-memory/{id}/)  │
│  MEMORY.md auto-injected (200 lines max, native)     │
├─────────────────────────────────────────────────────┤
│  Level 2: Agent Definition (.claude/agents/{id}.md)  │
│  DNA + Enhancement: persona, commands, constraints   │
├─────────────────────────────────────────────────────┤
│  Level 1: Rules (.claude/rules/)                     │
│  Glob-targeted context injection (native)            │
└─────────────────────────────────────────────────────┘
```

Each level adds specificity. Claude Code handles injection natively — no custom pipeline.

---

## 2. SYNAPSE → SYNAPSE-Lite Comparison

| Capability | SYNAPSE (v1) | SYNAPSE-Lite (v2) | Mechanism |
|-----------|-------------|------------------|-----------|
| Per-prompt context injection | 8-layer engine (~2000 LOC) | `user-prompt-submit.sh` | Native UserPromptSubmit hook |
| Agent activation | UAP pipeline (~300 LOC) | `session-start.sh` | Native SessionStart hook |
| Greeting generation | greeting-builder.js (~150 LOC) | Agent `.md` Enhancement section | Agent file |
| Memory injection | MemoryBridge (pro-gated) | MEMORY.md auto-inject (native) | Claude Code native |
| Context brackets | context-tracker.js | `context-brackets.md` rule | Rules file |
| Authority enforcement | agent-context.md (12 files) | `.claude/rules/agent-{id}-authority.md` | Rules glob-targeting |
| Session digest | Custom hook | `precompact-session-digest.cjs` | Native PreCompact hook |
| Quality gate | Custom script | `stop-quality-gate.sh` | Native Stop hook |

**Result:** ~90% reduction in custom code maintenance surface.

---

## 3. Memory Architecture (Before → After)

### Before (v1 — 4 locations)

```
1. .aios-core/development/agents/{id}/MEMORY.md    (manual load)
2. .aios-core/development/agents/{id}/agent-context.md  (manual load)
3. .synapse/agent-{id}                              (SYNAPSE domain file)
4. .claude/agents/{id}.md                          (persona only)
```

### After (v2 — 2 + rules)

```
1. .claude/agents/{id}.md                          ← DNA + Enhancement (auto-load as system prompt)
2. .claude/agent-memory/{id}/MEMORY.md             ← Persistent memory (auto-inject, 200 lines)
3. .claude/rules/agent-{id}-authority.md           ← Authority boundaries (glob-targeted)
```

**Note:** `agent-context.md` files are deprecated (AGF-6). They contain deprecation notices
pointing to the new locations above. They will be removed after AGF-7 confirmation.

---

## 4. Active Hooks (SYNAPSE-Lite)

All hooks are in `.claude/hooks/`. Registered in `.claude/settings.json`.

| Hook | File | Purpose |
|------|------|---------|
| SessionStart | `session-start.sh` | Agent activation report, project status |
| UserPromptSubmit | `user-prompt-submit.sh` | Per-prompt context injection |
| PreCompact | `precompact-session-digest.cjs` + `pre-compact-persona.sh` | Session digest |
| Stop | `stop-quality-gate.sh` | Quality gate on session stop |

**Deprecated:** `synapse-engine.cjs` — replaced by `user-prompt-submit.sh` (AGF-5).

---

## 5. Cross-IDE Compatibility

Agents are distributed to all supported IDEs via IDE sync:

| IDE | Location | Method |
|-----|----------|--------|
| Claude Code | `.claude/agents/{id}.md` | Native agent files |
| Codex | `.codex/agents/{id}.md` | Junction/symlink |
| Gemini | `packages/gemini-aios-extension/agents/` | File sync |
| Cursor | `.cursor/rules/` | Rules export |

IDE sync scripts: `.aios-core/infrastructure/scripts/ide-sync/`

**Memory junctions:** `.claude/agent-memory/{id}/MEMORY.md` files are junctioned to
`aios-core-memory` submodule for cross-IDE persistence.

---

## 6. Agent Definitions (Source of Truth)

Source definitions remain in `.aios-core/development/agents/{id}/{id}.md`.
Claude Code uses `.claude/agents/{id}.md` (synced from source via IDE sync).

### 10 Core Agents

| ID | Persona | Role |
|----|---------|------|
| `aios-master` | Orion | Framework orchestrator |
| `analyst` | Alex | Research and analysis |
| `architect` | Aria | System architecture |
| `data-engineer` | Dara | Database and migrations |
| `dev` | Dex | Code implementation |
| `devops` | Gage | CI/CD, git push (EXCLUSIVE) |
| `pm` | Morgan | Product management |
| `po` | Pax | Product owner, story validation |
| `qa` | Quinn | Quality assurance |
| `sm` | River | Scrum master, story creation |
| `ux-design-expert` | Uma | UX/UI design |

---

## 7. Deprecated Components (Preserved for Rollback)

The following are deprecated since AGF-6 and preserved for 1 sprint rollback:

| Component | Replacement | Location |
|-----------|------------|----------|
| `unified-activation-pipeline.js` (UAP) | `session-start.sh` | `.aios-core/development/scripts/` |
| `greeting-builder.js` | Agent `.md` Enhancement section | `.aios-core/development/scripts/` |
| `synapse-engine.cjs` | `user-prompt-submit.sh` | `.claude/hooks/` |
| `.synapse/` directory | `.claude/rules/` | `.synapse/` (preserved) |
| `agent-context.md` (12 files) | `.claude/rules/agent-{id}-authority.md` | `.aios-core/development/agents/*/` |

**Rollback path:** See `.synapse/DEPRECATED.md` for rollback instructions.

---

## 8. ADR Decisions

Key decisions documented in ADR-AGF-3:

- **D9:** Consolidate memory from 4 locations to 2+rules
- **D10:** Deprecate SYNAPSE full engine, keep SYNAPSE-Lite (4 hooks)
- **D11:** Use native Claude Code MEMORY.md injection (no custom bridge)
- **D12:** Glob-targeted rules replace agent-context.md authority files

---

*Architecture v2.0 — Agent Fidelity Epic (AGF)*
*CLI First | Observability Second | UI Third*
