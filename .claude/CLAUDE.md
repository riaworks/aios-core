# CLAUDE.md - Synkra AIOS

Este arquivo configura o comportamento do Claude Code ao trabalhar neste repositório.

---

## Constitution

O AIOS possui uma **Constitution formal** com princípios inegociáveis e gates automáticos.

**Documento completo:** `.aios-core/constitution.md`

| Artigo | Princípio | Severidade |
|--------|-----------|------------|
| I | CLI First | NON-NEGOTIABLE |
| II | Agent Authority | NON-NEGOTIABLE |
| III | Story-Driven Development | MUST |
| IV | No Invention | MUST |
| V | Quality First | MUST |
| VI | Absolute Imports | SHOULD |

**Gates automáticos bloqueiam violações.** Consulte a Constitution para detalhes completos.

---

## Premissa Arquitetural: CLI First

```
CLI First → Observability Second → UI Third
```

A CLI é a fonte da verdade. Toda funcionalidade nova deve funcionar 100% via CLI antes de qualquer UI.

> **Referência formal:** Constitution Artigo I - CLI First (NON-NEGOTIABLE)

---

## Estrutura do Projeto

```
aios-core/
├── .aios-core/              # Core do framework
│   ├── core/                # Módulos principais
│   ├── data/                # Knowledge base, entity registry
│   ├── development/         # Agents, tasks, templates, scripts
│   └── infrastructure/      # CI/CD templates, scripts
├── .claude/
│   ├── agents/              # Agent definitions (DNA + Enhancement)
│   ├── agent-memory/        # Persistent agent memory
│   ├── hooks/               # Claude Code hooks (SYNAPSE-Lite)
│   └── rules/               # Context rules (glob-targeted)
├── bin/                     # CLI executables
├── docs/stories/            # Development stories (active/, completed/)
├── packages/                # Shared packages
└── tests/                   # Testes
```

---

## Sistema de Agentes

### Modos de Ativação

| Modo | Comando | Uso |
|------|---------|-----|
| Interativo (skill) | `/aios-devops` | Persona na conversa |
| Autônomo | `@devops` | Executa e retorna resultado |

### Agentes Disponíveis

| Agente | Persona | Escopo Principal |
|--------|---------|------------------|
| `@dev` | Dex | Implementação de código |
| `@qa` | Quinn | Testes e qualidade |
| `@architect` | Aria | Arquitetura e design técnico |
| `@pm` | Morgan | Product Management |
| `@po` | Pax | Product Owner, stories/epics |
| `@sm` | River | Scrum Master |
| `@analyst` | Alex | Pesquisa e análise |
| `@data-engineer` | Dara | Database design |
| `@ux-design-expert` | Uma | UX/UI design |
| `@devops` | Gage | CI/CD, git push (EXCLUSIVO) |

### Arquitetura de Memória (AGF-6)

```
1. .claude/agents/{id}.md           ← DNA + Enhancement (corpo do agente)
2. .claude/agent-memory/{id}/MEMORY.md  ← Memória persistente (200 linhas, auto-inject)
3. .claude/rules/agent-{id}-*.md   ← Regras glob-targeted
```

### Comandos de Agentes
Prefixo `*`: `*help`, `*create-story`, `*task {name}`, `*exit`

### Mapeamento Agente → Codebase

| Agente | Diretórios Principais |
|--------|----------------------|
| `@dev` | `packages/`, `.aios-core/core/`, `bin/` |
| `@architect` | `docs/architecture/`, system design |
| `@data-engineer` | `packages/db/`, migrations, schema |
| `@qa` | `tests/`, `*.test.js`, quality gates |
| `@po` | Stories, epics, requirements |
| `@devops` | `.github/`, CI/CD, git operations |

---

## Story-Driven Development

1. **Trabalhe a partir de stories** - Todo desenvolvimento começa com uma story em `docs/stories/`
2. **Atualize progresso** - Marque checkboxes: `[ ]` → `[x]`
3. **Rastreie mudanças** - Mantenha a seção File List na story
4. **Siga critérios** - Implemente exatamente o que os acceptance criteria especificam

### Workflow de Story
```
@po *create-story → @dev implementa → @qa testa → @devops push
```

---

## Uso de Ferramentas

| Tarefa | Use | Não Use |
|--------|-----|---------|
| Buscar conteúdo | `Grep` tool | `grep`/`rg` no bash |
| Ler arquivos | `Read` tool | `cat`/`head`/`tail` |
| Editar arquivos | `Edit` tool | `sed`/`awk` |
| Buscar arquivos | `Glob` tool | `find` |
| Operações complexas | `Task` tool | Múltiplos comandos manuais |

---

## Comandos Frequentes

```bash
# Desenvolvimento
npm run dev                 # Iniciar desenvolvimento
npm test                    # Rodar testes
npm run lint                # Verificar estilo
npm run build               # Build produção

# AIOS
npx aios-core install       # Instalar AIOS
npx aios-core doctor        # Diagnóstico do sistema
npx aios-core info          # Informações do sistema
```

---

## Language Configuration

Language preference is handled by Claude Code's native `language` setting (v2.1.0+).
Configure in `~/.claude/settings.json` (global) or `.claude/settings.json` (project):
```json
{ "language": "portuguese" }
```

---

## MCP Usage

Ver `.claude/rules/mcp-usage.md` para regras detalhadas.

**Resumo:** Preferir ferramentas nativas do Claude Code sobre MCP. `@devops` gerencia toda infraestrutura MCP.

---

## Rules Directory

Domain-specific rules are in `.claude/rules/` (auto-loaded by Claude Code):

| File | Scope | Content |
|------|-------|---------|
| `global-coding-standards.md` | All | Coding standards, naming, TypeScript, error handling |
| `git-conventions.md` | All | Commit format, branches, push authority |
| `test-conventions.md` | `tests/**` | Test structure, quality gates, skip policy |
| `session-management.md` | All | Session tracking, performance, error recovery |
| `debug-config.md` | All | Debug mode, log locations, diagnostics |
| `agent-context-loading.md` | All | Agent context protocol (AGF-6 consolidated) |
| `constitution.md` | All | Constitution principles (L0) |
| `context-brackets.md` | All | Context window management |

---

*Synkra AIOS Claude Code Configuration v5.0 (AGF-6)*
*CLI First | Observability Second | UI Third*
