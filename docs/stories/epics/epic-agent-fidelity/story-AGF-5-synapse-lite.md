# Story AGF-5: SYNAPSE-Lite — UserPromptSubmit Hook + XML Injection + Bracket Inversion

**Epic:** Agent Fidelity (AGF) — Ensuring consistent agent behavior across all invocation modes
**Story ID:** AGF-5
**Priority:** High
**Points:** 13
**Effort:** 8-12 hours
**Status:** Ready for Review
**Type:** Feature / Infrastructure
**Lead:** @dev (Dex)
**Quality Gate:** @qa (Quinn)
**Architect Review:** @architect (Aria)
**PO Validation:** @po (Pax) — GO condicional (82/100) — spike hooks aplicado 2026-02-20
**Depends On:** AGF-4 (Activation Foundation — hooks infra, DNA/Enhancement split)
**Repository:** aios-core (branch: pedro-aios)
**ADR:** `docs/architecture/adr/ADR-AGF-3-OPTIMAL-AGENT-ACTIVATION-ARCHITECTURE.md`

## Executor Assignment

```yaml
executor: "@dev"
quality_gate: "@qa"
architect_review: "@architect"
adr_decisions: [D6, D10, D11, D12]
```

---

## User Story

**Como** framework AIOS,
**Quero** um hook UserPromptSubmit que injete contexto hierarquico XML a cada prompt (com deteccao de troca de agente, keyword RECALL, e estimativa de bracket), mais um Stop hook para quality gates,
**Para** atingir Nivel 3 de fidelidade (95-100%) com injecao contextual inteligente que aumenta quando o contexto diminui — substituindo o SYNAPSE engine monolitico (~2000 LOC) por 4 hooks nativos (~200 LOC).

---

## Background

### Decisoes do ADR que esta story implementa

| ADR Decision | Descricao | Implementacao nesta story |
|-------------|-----------|--------------------------|
| **D6** | UserPromptSubmit para troca mid-session | Regex `@\w+` detecta mudanca de agente |
| **D10** | SYNAPSE dissolve em SYNAPSE-Lite | Migracao de domains para rules |
| **D11** | Injecao hierarquica XML com priority | Output estruturado do hook |
| **D12** | Inversao de bracket | Mais injecao quando menos contexto |

### Pre-requisitos (AGF-4)

Esta story assume que AGF-4 entregou:
- [x] SessionStart hook funcional (branch info, active agent, env vars via `$CLAUDE_ENV_FILE`)
- [x] PreCompact hook funcional (DNA preservation via `hookSpecificOutput.additionalContext`)
- [x] DNA/Enhancement split em todos os agent files
- [x] `.claude/settings.json` criado com hooks SessionStart + PreCompact registrados
- [x] `.claude/agent-memory/.active-agent` file
- [x] `.claude/agent-memory/.env` file (state persistido pelo SessionStart, lido por outros hooks via path fixo)

> **Spike 2026-02-20:** `$CLAUDE_ENV_FILE` e disponivel APENAS no evento SessionStart. Outros hooks (UserPromptSubmit, Stop) devem usar path fixo `$CLAUDE_PROJECT_DIR/.claude/agent-memory/.env` para ler/escrever estado.

### SYNAPSE Engine → SYNAPSE-Lite

```
ANTES (SYNAPSE Engine):                DEPOIS (SYNAPSE-Lite):
~2000 LOC JavaScript                   ~200 LOC bash (4 hooks)
749 testes unitarios                   ~50 testes
8 layers custom                        .claude/rules/*.md nativos
.synapse/ runtime directory            .claude/agent-memory/.env + rules
Custom diagnostics (10 collectors)     Stop hook quality gate
Memory Bridge (Pro-gated)              memory: project nativo
```

---

## Scope

### IN Scope

1. **UserPromptSubmit hook** — Script bash com 3 funcionalidades:
   - **Agent switch detection**: Regex `@\w+` detecta mudanca, re-injeta DNA
   - **Keyword RECALL**: Pattern matching para regras contextuais (ex: "supabase" → RLS rules)
   - **Bracket estimation**: Heuristica baseada em `prompt_count` em `.claude/agent-memory/.env` (path fixo; `$CLAUDE_ENV_FILE` NAO disponivel neste evento)

2. **XML hierarchical injection** (D11) — Output do hook em formato XML estruturado:
   ```xml
   <agent-context priority="critical">...</agent-context>
   <session-state priority="high">...</session-state>
   <keyword-rules priority="medium">...</keyword-rules>
   <context-bracket priority="low">...</context-bracket>
   ```

3. **Bracket inversion** (D12) — Volume de injecao inversamente proporcional ao contexto:
   - FRESH (prompt < 10): ~200 tokens
   - MODERATE (10-24): ~400 tokens
   - DEPLETED (25-39): ~600 tokens + DNA re-injection
   - CRITICAL (40+): ~800 tokens + handoff recommendation

4. **Stop hook** — Quality gate basico:
   - **CRITICAL:** Deve checar `stop_hook_active` no input JSON para evitar loops infinitos
   - Verifica se testes passam (se mudancas de codigo foram feitas)
   - Gera summary da sessao
   - Escreve metricas em `.claude/agent-memory/.env` (path fixo; `$CLAUDE_ENV_FILE` NAO disponivel neste evento)

5. **SYNAPSE domain migration** — Migrar `.synapse/` domains para `.claude/rules/`:
   - L0 Constitution → `.claude/rules/constitution.md`
   - L1 Global → `.claude/rules/global-*.md`
   - L2 Agent → `.claude/rules/agent-{id}-*.md`
   - L3 Workflow → `.claude/rules/workflow-{name}.md`
   - L5 Squad → `.claude/rules/squad-{name}.md`

6. **Keyword rules files** — `.claude/rules/keyword-{trigger}.md` com frontmatter `trigger:`

### OUT of Scope

- SessionStart hook (AGF-4 — ja implementado)
- PreCompact hook (AGF-4 — ja implementado)
- DNA/Enhancement split (AGF-4 — ja implementado)
- UAP/greeting-builder deprecation (AGF-6)
- agent-context.md removal (AGF-6)
- CLAUDE.md optimization (AGF-6)
- Cross-IDE validation (AGF-6)

---

## Acceptance Criteria

### AC1: UserPromptSubmit Hook Registrado e Funcional

- [x] Hook registrado em `.claude/settings.json` no evento `UserPromptSubmit` (formato: `{"hooks":[{"type":"command","command":"..."}]}`)
- [x] Script existe em `.claude/hooks/user-prompt-submit.sh`
- [x] Hook recebe prompt do usuario via stdin (JSON: `{"prompt":"...","session_id":"...","cwd":"..."}`)
- [x] Hook retorna JSON: `{"hookSpecificOutput":{"hookEventName":"UserPromptSubmit","additionalContext":"<xml>"}}`
- [x] Hook NAO usa `$CLAUDE_ENV_FILE` (indisponivel neste evento) — usa path fixo `$CLAUDE_PROJECT_DIR/.claude/agent-memory/.env`
- [x] Hook NAO depende de `jq` — usa `node -e` ou regex bash para parsear JSON do stdin
- [x] Hook completa em < 500ms para deteccao, < 2s para full injection
- [x] Hook nao falha silenciosamente (exit 0 = sucesso, exit 2 = bloqueio com stderr)

### AC2: Agent Switch Detection (D6)

- [x] Regex `@\w+` no prompt detecta mudanca de agente
- [x] Quando detectado, re-injeta DNA (~150 tokens) do novo agente via `additionalContext`
- [x] Atualiza `.claude/agent-memory/.active-agent` com novo ID
- [x] Nao dispara para `@` em contexto de codigo (ex: email addresses, decorators)
- [x] Se agente nao existe, ignora silenciosamente

### AC3: Keyword RECALL

- [x] Keyword rules definidos em `.claude/rules/keyword-*.md` com frontmatter `trigger:`
- [x] Hook faz pattern matching do prompt contra keywords
- [x] Keywords matchados geram `<keyword-rules>` no XML output
- [x] Pelo menos 3 keyword rules criados: `supabase`, `migration`, `deploy`
- [x] Zero overhead quando nenhum keyword matcha (sparse injection)

### AC4: Bracket Estimation e Inversion (D12)

- [x] Hook le `prompt_count` de `$CLAUDE_PROJECT_DIR/.claude/agent-memory/.env` (path fixo, NAO `$CLAUDE_ENV_FILE`)
- [x] Incrementa `prompt_count` a cada execucao (escreve de volta no .env com abordagem cross-platform, sem `sed -i`)
- [x] Bracket calculado: FRESH (<10), MODERATE (10-24), DEPLETED (25-39), CRITICAL (40+)
- [x] Volume de injecao aumenta com bracket:
  - FRESH: ~200 tokens (session-state + keyword-rules)
  - MODERATE: ~400 tokens (+ bracket warning)
  - DEPLETED: ~600 tokens (+ DNA re-injection)
  - CRITICAL: ~800 tokens (+ handoff recommendation)

### AC5: XML Hierarchical Output (D11)

- [x] Output segue formato XML com priority attributes
- [x] Priorities: critical > high > medium > low
- [x] `<agent-context priority="critical">` sempre presente quando agente ativo
- [x] `<session-state priority="high">` sempre presente
- [x] `<keyword-rules priority="medium">` apenas quando keywords matcham
- [x] `<context-bracket priority="low">` apenas em MODERATE+ brackets
- [x] Output e JSON valido: `{"hookSpecificOutput":{"hookEventName":"UserPromptSubmit","additionalContext":"<xml>"}}`

### AC6: Stop Hook Funcional

- [x] Hook registrado em `.claude/settings.json` no evento `Stop`
- [x] Script existe em `.claude/hooks/stop-quality-gate.sh`
- [x] **CRITICAL:** Hook checa `stop_hook_active` no input JSON — se `true`, retorna `{}` imediatamente para evitar loop infinito
- [x] Hook recebe input: `{"stop_hook_active":bool,"last_assistant_message":"..."}`
- [x] Hook verifica se houve mudancas de codigo (git diff)
- [x] Se mudancas existem, retorna `{"decision":"block","reason":"N files changed. Run tests."}` para Claude continuar
- [x] Se sem mudancas, retorna `{}` (aceita parada)
- [x] Escreve metricas em `$CLAUDE_PROJECT_DIR/.claude/agent-memory/.env` (path fixo, NAO `$CLAUDE_ENV_FILE`)

### AC7: SYNAPSE Domains Migrados para Rules

- [x] Cada SYNAPSE domain tem equivalente em `.claude/rules/`
- [x] Rules tem glob frontmatter correto para targeting
- [x] Naming convention: `agent-{id}-*.md`, `global-*.md`, `workflow-*.md`, `squad-*.md`
- [x] `.synapse/` directory NÃO deletado nesta story (preservado para rollback)

### AC8: Testes

- [x] Testes para UserPromptSubmit hook (agent switch, keyword, bracket)
- [x] Testes para Stop hook (quality gate output)
- [x] Testes para XML output format validation
- [x] `npm test` passa sem regressoes

---

## Implementation Plan

### Fase 1: UserPromptSubmit Hook Core (~3h)

Criar `.claude/hooks/user-prompt-submit.sh`:

```bash
#!/bin/bash
# UserPromptSubmit hook — SYNAPSE-Lite (ADR D6, D11, D12)
# Input: JSON via stdin with { "prompt": "...", "session_id": "...", "cwd": "..." }
# Output: JSON via stdout with hookSpecificOutput.additionalContext
# NOTE: $CLAUDE_ENV_FILE is NOT available in this event — use fixed paths

INPUT=$(cat)
# Parse prompt without jq (not available on Windows Git Bash)
PROMPT=$(node -e "process.stdout.write(JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).prompt||'')" <<< "$INPUT" 2>/dev/null || echo "")

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
ENV_FILE="$PROJECT_DIR/.claude/agent-memory/.env"
AGENT_FILE="$PROJECT_DIR/.claude/agent-memory/.active-agent"

# --- Read state ---
ACTIVE_AGENT=$(cat "$AGENT_FILE" 2>/dev/null || echo "none")
PROMPT_COUNT=$(grep '^AIOS_PROMPT_COUNT=' "$ENV_FILE" 2>/dev/null | cut -d= -f2 || echo "0")
PROMPT_COUNT=$((PROMPT_COUNT + 1))

# --- Agent switch detection (D6) ---
SWITCH_AGENT=""
if echo "$PROMPT" | grep -qE '^@([a-z][a-z0-9-]+)'; then
  NEW_AGENT=$(echo "$PROMPT" | grep -oE '@([a-z][a-z0-9-]+)' | head -1 | sed 's/@//')
  if [ "$NEW_AGENT" != "$ACTIVE_AGENT" ] && [ -f "$PROJECT_DIR/.claude/agents/${NEW_AGENT}.md" ]; then
    SWITCH_AGENT="$NEW_AGENT"
    echo "$NEW_AGENT" > "$AGENT_FILE"
    ACTIVE_AGENT="$NEW_AGENT"
  fi
fi

# --- Bracket estimation (D12) ---
if [ "$PROMPT_COUNT" -lt 10 ]; then
  BRACKET="FRESH"
elif [ "$PROMPT_COUNT" -lt 25 ]; then
  BRACKET="MODERATE"
elif [ "$PROMPT_COUNT" -lt 40 ]; then
  BRACKET="DEPLETED"
else
  BRACKET="CRITICAL"
fi

# --- Build XML injection (D11) ---
XML=""

# Critical: agent context (always if agent active)
if [ "$ACTIVE_AGENT" != "none" ] && [ -f "$PROJECT_DIR/.claude/agents/${ACTIVE_AGENT}.md" ]; then
  IDENTITY=$(sed -n '/PERSONA DNA/,/ENHANCEMENT/{/PERSONA DNA/d;/ENHANCEMENT/d;p;}' \
    "$PROJECT_DIR/.claude/agents/${ACTIVE_AGENT}.md" | head -10)
  IDENTITY_ESCAPED=$(echo "$IDENTITY" | tr '\n' ' ' | sed 's/"/\\"/g')
  XML+="<agent-context priority=\"critical\">"
  XML+="<identity>${IDENTITY_ESCAPED}</identity>"
  XML+="</agent-context>"
fi

# High: session state (always)
BRANCH=$(grep '^AIOS_BRANCH=' "$ENV_FILE" 2>/dev/null | cut -d= -f2 || echo "unknown")
XML+="<session-state priority=\"high\">"
XML+="<branch>${BRANCH}</branch>"
XML+="<prompt-count>${PROMPT_COUNT}</prompt-count>"
XML+="<bracket>${BRACKET}</bracket>"
XML+="</session-state>"

# Medium: keyword rules (sparse — only when matched)
# [keyword matching logic — Fase 2]

# Low: bracket advice (MODERATE+)
if [ "$BRACKET" != "FRESH" ]; then
  XML+="<context-bracket priority=\"low\">"
  XML+="<status>${BRACKET}</status>"
  if [ "$BRACKET" = "CRITICAL" ]; then
    XML+="<advice>Session approaching limit. Consider /compact or session handoff.</advice>"
  elif [ "$BRACKET" = "DEPLETED" ]; then
    XML+="<advice>Context depleted. Agent identity being reinforced.</advice>"
  fi
  XML+="</context-bracket>"
fi

# --- Update state (cross-platform, no sed -i) ---
TMPFILE=$(mktemp)
grep -v '^AIOS_PROMPT_COUNT=' "$ENV_FILE" 2>/dev/null > "$TMPFILE" || true
echo "AIOS_PROMPT_COUNT=${PROMPT_COUNT}" >> "$TMPFILE"
mv "$TMPFILE" "$ENV_FILE"

# --- Output (hookSpecificOutput format) ---
cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": "${XML}"
  }
}
EOF

exit 0
```

> **Notas tecnicas (spike 2026-02-20):**
> - `jq` substituido por `node -e` (Node.js sempre disponivel)
> - `sed -i` substituido por `mktemp` + `mv` (cross-platform)
> - `$CLAUDE_ENV_FILE` substituido por path fixo via `$CLAUDE_PROJECT_DIR`
> - Output usa `hookSpecificOutput` com `hookEventName` (formato correto da API)

### Fase 2: Keyword RECALL System (~1.5h)

Criar keyword rules em `.claude/rules/keyword-*.md`:

```markdown
---
trigger: supabase
---
# Supabase Context Rules
- Always use RLS policies for data access
- Check migrations before schema changes
- Use service role key only in server-side code
```

Integrar no hook: ler arquivos `keyword-*.md`, match trigger against prompt.

> **Nota:** `trigger:` NAO e campo nativo do Claude Code rules (que usa `paths:` e `globs:`). O hook faz custom parsing do frontmatter para extrair triggers. Isso e intencional — keyword rules sao ativados pelo hook, nao pelo Claude Code rules engine.

### Fase 3: Stop Hook (~1.5h)

Criar `.claude/hooks/stop-quality-gate.sh`:

```bash
#!/bin/bash
# Stop hook — Quality gate + session summary (ADR D10)
# Input: JSON via stdin with { "stop_hook_active": bool, "last_assistant_message": "..." }
# Output: JSON via stdout — {"decision":"block","reason":"..."} to continue, {} to accept stop
# NOTE: $CLAUDE_ENV_FILE is NOT available in this event — use fixed paths
# CRITICAL: Must check stop_hook_active to prevent infinite loops!

INPUT=$(cat)
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
ENV_FILE="$PROJECT_DIR/.claude/agent-memory/.env"

# --- INFINITE LOOP GUARD (CRITICAL) ---
# If stop_hook_active is true, we are in a re-entry from a previous block decision
# Return {} immediately to allow the stop to proceed
STOP_ACTIVE=$(node -e "process.stdout.write(String(JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).stop_hook_active||false))" <<< "$INPUT" 2>/dev/null || echo "false")
if [ "$STOP_ACTIVE" = "true" ]; then
  echo '{}'
  exit 0
fi

PROMPT_COUNT=$(grep '^AIOS_PROMPT_COUNT=' "$ENV_FILE" 2>/dev/null | cut -d= -f2 || echo "0")
AGENT=$(cat "$PROJECT_DIR/.claude/agent-memory/.active-agent" 2>/dev/null || echo "none")

# Check if code was modified
CHANGED_FILES=$(git diff --name-only 2>/dev/null | wc -l | tr -d ' ')

RESULT=""
if [ "$CHANGED_FILES" -gt 0 ]; then
  # "block" = prevent Claude from stopping (i.e., tell it to continue working and run tests)
  # NOTE: "block" does NOT mean "block the session" — it means "block the stop request"
  RESULT="{\"decision\": \"block\", \"reason\": \"${CHANGED_FILES} files changed. Consider running tests before ending session.\"}"
else
  RESULT="{}"
fi

# Write session metrics (append to .env)
echo "AIOS_SESSION_END=$(date +%Y-%m-%dT%H:%M:%S 2>/dev/null || date)" >> "$ENV_FILE"
echo "AIOS_SESSION_PROMPTS=${PROMPT_COUNT}" >> "$ENV_FILE"
echo "AIOS_SESSION_AGENT=${AGENT}" >> "$ENV_FILE"

echo "$RESULT"
exit 0
```

> **Notas tecnicas (spike 2026-02-20):**
> - Guard `stop_hook_active` e OBRIGATORIO — sem ele, loop infinito
> - `"decision":"suggest"` NAO existe — valores validos: `"block"` (continua) ou `{}` (aceita)
> - `date -Iseconds` substituido por `date +%Y-%m-%dT%H:%M:%S` (Windows compat)
> - `$CLAUDE_ENV_FILE` substituido por path fixo

### Fase 4: SYNAPSE Domain Migration (~2h)

Migrar cada SYNAPSE domain para `.claude/rules/`:

| SYNAPSE Layer | Source | Target |
|---------------|--------|--------|
| L0 Constitution | `.aios-core/constitution.md` | `.claude/rules/constitution.md` (link/copy) |
| L1 Global | `.synapse/global-rules` | `.claude/rules/global-coding-standards.md` |
| L2 Agent | `.synapse/agent-{id}` | `.claude/rules/agent-{id}-rules.md` |
| L3 Workflow | `.synapse/workflow-*` | `.claude/rules/workflow-{name}.md` |
| L5 Squad | `.synapse/squad-*` | `.claude/rules/squad-{name}.md` |

Glob targeting em cada file via frontmatter.

**Arquivos `.synapse/` adicionais (decisao necessaria):**

| Arquivo | Decisao | Destino |
|---------|---------|---------|
| `manifest` | Deprecar | Estado gerenciado por `.claude/agent-memory/.env` |
| `context` | Migrar | `.claude/rules/context-brackets.md` ou logica no UserPromptSubmit hook |
| `commands` | Ignorar | Star-commands ja sao skills nativos |
| `my-custom-rules` | Migrar | `.claude/rules/custom-rules.md` |
| `cache/`, `sessions/` | Ignorar | Runtime data, nao migrar |
| `metrics/` | Ignorar | Stop hook gera metricas proprias |

### Fase 5: Hook Registration (~0.5h)

Atualizar `.claude/settings.json` (criado na AGF-4) para incluir todos os 4 hooks:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [
          {
            "type": "command",
            "command": "bash \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/session-start.sh",
            "timeout": 10
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/user-prompt-submit.sh",
            "timeout": 5
          }
        ]
      }
    ],
    "PreCompact": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/precompact-session-digest.cjs"
          },
          {
            "type": "command",
            "command": "bash \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/pre-compact-persona.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash \"$CLAUDE_PROJECT_DIR\"/.claude/hooks/stop-quality-gate.sh",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

> **Formato correto (spike 2026-02-20):** Cada evento e um array de matchers, cada matcher tem um array de hooks. Hooks no mesmo array executam em paralelo. `$CLAUDE_PROJECT_DIR` para paths absolutos.

### Fase 6: Testes + Validacao (~1.5h)

```bash
# IMPORTANTE: Executar todos os comandos a partir da raiz do projeto
# Os hooks usam ${CLAUDE_PROJECT_DIR:-.} que resolve para "." (diretorio atual)

npm test

# Testar hooks manualmente (executar da raiz do projeto):
echo '{"prompt":"@qa review this"}' | bash .claude/hooks/user-prompt-submit.sh
echo '{"prompt":"hello"}' | bash .claude/hooks/user-prompt-submit.sh
echo '{}' | bash .claude/hooks/stop-quality-gate.sh
echo '{"stop_hook_active":true}' | bash .claude/hooks/stop-quality-gate.sh
```

---

## Risks

| ID | Risco | Prob. | Impacto | Mitigacao |
|----|-------|-------|---------|-----------|
| R1 | UserPromptSubmit hook adiciona latencia perceptivel | Media | Medio | Budget <500ms; regex + file reads sao rapidos; timeout de 5s configurado |
| R2 | Agent switch regex falso positivo (`@media`, `@import`, emails) | Media | Baixo | Regex `^@[a-z]` (inicio de prompt) + validar que .md existe |
| R3 | Bracket heuristica imprecisa | Alta | Baixo | Prompt_count e conservador; iterar com dados reais |
| R4 | XML injection consome tokens excessivos | Baixa | Medio | Priority-based truncation; monitorar token budget |
| R5 | SYNAPSE domain migration incompleta (6 arquivos adicionais nao mapeados) | Media | Medio | Tabela de decisao adicionada na Fase 4; preservar .synapse/ para rollback |
| R6 | ~~`$CLAUDE_ENV_FILE` race condition entre hooks~~ | ~~Eliminado~~ | — | **SPIKE CONCLUIDO:** `$CLAUDE_ENV_FILE` so existe no SessionStart. Outros hooks usam path fixo `.env` com file locking implicito (escrita sequencial) |
| R7 | Windows Git Bash: `sed -i`, `jq`, `date -I` incompativeis | Media | Alto | `sed -i` → `mktemp+mv`; `jq` → `node -e`; `date -I` → `date +%Y-%m-%dT%H:%M:%S` |
| R8 | Stop hook loop infinito se `stop_hook_active` nao checado | Alta | Critico | Guard obrigatorio na primeira linha do script; AC6 documenta explicitamente |
| R9 | `trigger:` frontmatter nao e campo nativo do Claude Code rules | Baixa | Baixo | Intencional — hook faz custom parsing; documentado na Fase 2 |

---

## File List

### Arquivos a CRIAR

| # | Arquivo | Descricao | Fase |
|---|---------|-----------|------|
| 1 | `.claude/hooks/user-prompt-submit.sh` | UserPromptSubmit hook | F1 |
| 2 | `.claude/hooks/stop-quality-gate.sh` | Stop hook | F3 |
| 3-5 | `.claude/rules/keyword-{supabase,migration,deploy}.md` | Keyword rules | F2 |
| 6-N | `.claude/rules/{constitution,global-*,workflow-*,squad-*}.md` | Migrated SYNAPSE domains | F4 |

### Arquivos a MODIFICAR

| # | Arquivo | Acao | Fase |
|---|---------|------|------|
| M1 | `.claude/settings.json` | Registrar UserPromptSubmit + Stop hooks | F5 |

### Arquivos NÃO Deletados (preservados)

| Arquivo | Razao |
|---------|-------|
| `.synapse/` directory | Rollback path durante transicao |

---

## Definition of Done

- [x] UserPromptSubmit hook detecta agent switch, keywords, e bracket
- [x] XML hierarchical injection com 4 priority levels funciona
- [x] Bracket inversion escala injecao: 200→400→600→800 tokens
- [x] Stop hook gera quality gate suggestion + metricas
- [x] SYNAPSE domains migrados para `.claude/rules/` com glob targeting
- [x] 4 hooks registrados em `.claude/settings.json`
- [x] Keyword rules sparse (zero tokens quando sem match)
- [x] Testes passam sem regressoes
- [x] Handoff para AGF-6 (Consolidation)

---

## CodeRabbit Configuration

```yaml
reviews:
  path_instructions:
    - path: ".claude/hooks/user-prompt-submit.sh"
      instructions: "Verify POSIX compatibility for Windows bash. Check regex for agent switch avoids false positives (@media, @import, emails). Verify JSON output is valid. Check performance budget (<500ms detection, <2s full injection)."
    - path: ".claude/hooks/stop-quality-gate.sh"
      instructions: "Verify exit codes. Check session metrics are written correctly. Verify JSON output format."
    - path: ".claude/rules/keyword-*.md"
      instructions: "Verify frontmatter has trigger: field. Check rules are actionable and specific."
    - path: ".claude/rules/{constitution,global-*,workflow-*,squad-*}.md"
      instructions: "Verify migrated content matches original SYNAPSE domain. Check glob frontmatter is correct."
    - path: ".claude/settings.json"
      instructions: "Verify all 4 hooks are registered with correct event names and command paths."
    - path: "tests/**"
      instructions: "Verify hook tests cover agent switch, keyword matching, bracket estimation. Check XML output format validation."
```

---

## Dev Agent Record

**Agent Model Used:** claude-sonnet-4-6

**Completion Notes:**
- F1: UserPromptSubmit hook implemented with `node -e` argv-based JSON parsing (avoids /dev/stdin issues on Windows Git Bash)
- F2: Keyword RECALL implemented via custom frontmatter `trigger:` parsing in hook; 3 rules created (supabase, migration, deploy)
- F3: Stop hook implemented with `stop_hook_active` infinite loop guard using node argv parsing
- F4: SYNAPSE domains migrated: constitution, global-coding-standards, workflow-* (3), context-brackets, custom-rules
- F5: settings.json updated with UserPromptSubmit (timeout: 5s) and Stop (timeout: 30s) hooks
- F6: 40 tests written and passing; pre-existing 16 failures in 3 unrelated suites confirmed unchanged

**File List:**

| File | Action |
|------|--------|
| `.claude/hooks/user-prompt-submit.sh` | CREATED |
| `.claude/hooks/stop-quality-gate.sh` | CREATED |
| `.claude/rules/keyword-supabase.md` | CREATED |
| `.claude/rules/keyword-migration.md` | CREATED |
| `.claude/rules/keyword-deploy.md` | CREATED |
| `.claude/rules/constitution.md` | CREATED |
| `.claude/rules/global-coding-standards.md` | CREATED |
| `.claude/rules/workflow-story-dev.md` | CREATED |
| `.claude/rules/workflow-arch-review.md` | CREATED |
| `.claude/rules/workflow-epic-create.md` | CREATED |
| `.claude/rules/context-brackets.md` | CREATED |
| `.claude/rules/custom-rules.md` | CREATED |
| `.claude/settings.json` | MODIFIED — added UserPromptSubmit + Stop hooks |
| `tests/hooks/agf5-hooks.test.js` | CREATED |

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-02-19 | Sistema | Story criada a partir do ADR-AGF-3 roadmap Phase B |
| 2026-02-19 | @po (Pax) | Validation: added CodeRabbit Configuration, PO Validation field, fixed pre-req checkboxes to unchecked (AGF-4 not yet complete) |
| 2026-02-20 | @po (Pax) | QA review improvements: (1) Pre-requisitos AGF-4 marcados [x] (dependencia confirmada Done); (2) Fase 6 testes: adicionado nota "executar da raiz do projeto" + casos de teste adicionais (prompt sem agent switch, stop_hook_active=true); (3) Stop hook: clarificado semantica de "block" = impedir parada, nao bloquear sessao |
| 2026-02-20 | @po (Pax) | Spike hooks aplicado (82/100 GO condicional). Correcoes: (1) `$CLAUDE_ENV_FILE` removido de UserPromptSubmit/Stop — usa path fixo `$CLAUDE_PROJECT_DIR/.claude/agent-memory/.env`; (2) Output JSON corrigido para `hookSpecificOutput` em todos os hooks; (3) Stop hook: guard `stop_hook_active` obrigatorio, `"suggest"` → `"block"`, `date -I` → `date +format`; (4) `jq` → `node -e`, `sed -i` → `mktemp+mv`; (5) settings.json formato corrigido (matcher+hooks array); (6) SYNAPSE migration: 6 arquivos adicionais mapeados; (7) Keyword `trigger:` documentado como custom parsing; (8) R6 eliminado, R8/R9 adicionados |

---

*Story derivada de: AGF-3 (Roundtable) → Phase B: SYNAPSE-Lite*
*ADR Decisions: D6, D10, D11, D12*
*Epic: Agent Fidelity (AGF) — CLI First | Observability Second | UI Third*
