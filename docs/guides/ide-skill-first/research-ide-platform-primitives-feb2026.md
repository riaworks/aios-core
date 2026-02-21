# IDE/AI Coding Platform Native Primitives Research

**Date:** 2026-02-17
**Analyst:** Atlas (AIOS Analyst Agent)
**Classification:** Strategic Research -- IDE Skill-First Migration
**Confidence Level:** HIGH (all data sourced from official docs and verified Feb 2026 publications)

---

## Executive Summary

The AI coding tool landscape has converged around a **cross-platform open standard** for Skills (`SKILL.md`), originally published by Anthropic in October 2025 and formalized as an open specification in December 2025. By February 2026, **every major platform** analyzed in this report has adopted or is actively adopting the Agent Skills standard.

**Key finding:** The four primitives -- AGENTS, SKILLS, TASKS, COMMANDS -- exist in varying degrees of maturity across platforms, but **SKILLS is the universal convergence point**. The other three primitives (Agents, Tasks, Commands) remain platform-specific with no cross-platform standard.

### Primitive Adoption Matrix (Summary)

| Platform | Agents | Skills | Tasks | Commands | Cross-Platform Skills |
|----------|--------|--------|-------|----------|-----------------------|
| Claude Code CLI | NATIVE | NATIVE | NATIVE | NATIVE (merged into Skills) | YES (creator of standard) |
| Codex CLI (OpenAI) | Via Agents SDK | NATIVE | Via Agents SDK | Via $prefix | YES |
| Codex App (OpenAI) | NATIVE (parallel threads) | NATIVE | NATIVE (thread-based) | Via $prefix | YES |
| Gemini CLI (Google) | NO native | NATIVE | NO native | NATIVE (TOML) | YES |
| Antigravity (Google) | NATIVE (agent-first) | NATIVE | NATIVE (Artifacts) | NO documented | YES |
| Cursor | NO native (agent mode) | NATIVE | NO native | NATIVE (custom /commands) | YES |
| Windsurf (Codeium) | NO native (Cascade) | NATIVE | NO native | NO (Rules only) | YES |
| GitHub Copilot | NATIVE (.github/agents) | NATIVE | Via coding agent | NO native | YES |
| Cline | NO native (custom modes) | NATIVE | NO native | Slash commands | YES (via .agents/skills) |
| Continue.dev | NATIVE (Hub agents) | Partial (via blocks) | NO native | NO native | Partial |
| JetBrains AI | Via ACP protocol | Via Plugin | Via Junie | NO native | Via ACP/Plugin |

---

## 1. Claude Code CLI (Anthropic)

### Overview
Claude Code is the **originator of the Agent Skills open standard** and has the most complete native implementation of all four primitives. As of February 2026 (v2.1.3+), custom slash commands have been formally merged into skills.

### AGENTS -- NATIVE, RICHEST IMPLEMENTATION
- **Definition location:** `.claude/agents/` (project) or `~/.claude/agents/` (personal)
- **File format:** Markdown files with YAML frontmatter
- **Persistent memory:** YES -- `memory` field supports `user`, `project`, or `local` scopes
  - Memory stored at `~/.claude/agent-memory/<name>/` or `.claude/agent-memory/<name>/`
  - `MEMORY.md` (first 200 lines) auto-loaded into system prompt
- **Activation mechanism:**
  - `/agents` command for interactive management
  - Claude auto-delegates based on `description` field matching
  - Explicit user request ("use the code-reviewer agent")
  - CLI flag: `claude --agents '{JSON}'` for session-only agents
- **Built-in agents:** Explore (Haiku, read-only), Plan (read-only research), General-purpose (full tools)
- **Agent Teams (experimental):** Multi-session orchestration with team lead + teammates
  - Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
  - Shared task list, inter-agent messaging, mailbox system
  - Teams stored at `~/.claude/teams/{team-name}/config.json`
  - Tasks stored at `~/.claude/tasks/{team-name}/`
- **Can agents invoke skills?** YES -- `skills` field in frontmatter preloads skill content into agent context
- **Key frontmatter fields:** `name`, `description`, `tools`, `disallowedTools`, `model`, `permissionMode`, `maxTurns`, `skills`, `mcpServers`, `hooks`, `memory`

### SKILLS -- NATIVE, STANDARD-DEFINING
- **Definition location:** `.claude/skills/<skill-name>/SKILL.md` (project), `~/.claude/skills/<skill-name>/SKILL.md` (personal)
- **File format:** YAML frontmatter + Markdown body (Agent Skills open standard)
- **Invocation:**
  - User: `/skill-name` (slash command)
  - Model: Auto-invoked when description matches task context
  - Control: `disable-model-invocation: true` (user-only), `user-invocable: false` (model-only)
- **Extended features beyond standard:**
  - `context: fork` -- run skill in isolated subagent
  - `agent` field -- specify which subagent type executes
  - Dynamic context injection via `!`command`` syntax
  - String substitution: `$ARGUMENTS`, `$ARGUMENTS[N]`, `$N`, `${CLAUDE_SESSION_ID}`
  - Hooks scoped to skill lifecycle
- **Supporting files:** `scripts/`, `references/`, `assets/`, templates, examples
- **Precedence:** Enterprise > Personal > Project (plugins use namespacing)
- **Budget:** Descriptions loaded at 2% of context window (fallback 16,000 chars)

### TASKS -- NATIVE (Via Task Tool / Agent Teams)
- **Task tool:** `Task()` delegates work to subagents within a session
- **Agent Teams task list:** Shared task list with dependency management (DAG)
  - States: pending, in progress, completed
  - File-lock based claiming prevents race conditions
  - Task dependencies auto-unblock when prerequisites complete
- **No standalone task file format** -- tasks are runtime constructs

### COMMANDS -- MERGED INTO SKILLS
- **Legacy location:** `.claude/commands/` still works
- **Current recommendation:** Use `.claude/skills/` instead
- **Equivalence:** `.claude/commands/review.md` = `.claude/skills/review/SKILL.md` (both create `/review`)
- **Skills take precedence** when a skill and command share the same name
- **Built-in commands:** `/help`, `/compact`, `/init`, `/agents`, `/context`, `/permissions`, `/statusline`

### Directory Structure Summary
```
.claude/
  agents/           # Custom subagent definitions (*.md with YAML frontmatter)
  agent-memory/     # Persistent agent memory directories
  skills/           # Skills (SKILL.md + supporting files)
  commands/         # Legacy commands (still functional)
  settings.json     # Permissions, hooks, environment
CLAUDE.md           # Project-level context/instructions
~/.claude/
  agents/           # Personal agents (all projects)
  skills/           # Personal skills (all projects)
  commands/         # Personal commands (all projects)
  agent-memory/     # User-scope agent memory
  teams/            # Agent team configs
  tasks/            # Agent team task lists
```

---

## 2. Codex CLI (OpenAI)

### Overview
OpenAI's Codex CLI is an open-source terminal coding agent built in Rust. It has adopted the Agent Skills open standard and extends it with `agents/openai.yaml` for UI metadata. The CLI integrates with the OpenAI Agents SDK for multi-agent orchestration.

### AGENTS -- VIA AGENTS SDK (Not Native File-Based)
- **No native `.codex/agents/` directory** for persistent agent personas
- **Multi-agent via Agents SDK:** Codex CLI can be exposed as an MCP server, then orchestrated by the Agents SDK
  - Supports parallel agents working on isolated worktrees
  - Roles like Project Manager, Designer, Frontend Dev, Backend Dev, Tester
- **AGENTS.md file:** Custom instructions file (similar to CLAUDE.md), NOT an agent definition
  - Discovery: `~/.codex/AGENTS.override.md` > `~/.codex/AGENTS.md` > project root `AGENTS.md`
  - Walks directory tree from project root to CWD
- **Persistent memory:** No native agent memory system

### SKILLS -- NATIVE
- **Definition location:**
  - `$CWD/.agents/skills/` (folder-specific, narrowest scope)
  - `$REPO_ROOT/.agents/skills/` (repo-wide)
  - `$HOME/.agents/skills/` (user-level)
  - `/etc/codex/skills` (system-wide)
  - Built-in skills (system)
- **File format:** `SKILL.md` with YAML frontmatter (Agent Skills standard)
- **Extended with `agents/openai.yaml`:**
  ```yaml
  interface:
    display_name: "User-facing name"
    icon_small: "./assets/logo.svg"
    brand_color: "#3B82F6"
    default_prompt: "Optional context"
  policy:
    allow_implicit_invocation: false
  dependencies:
    tools:
      - type: "mcp"
        value: "toolName"
  ```
- **Invocation:**
  - Explicit: `$skill-name` prefix in prompts
  - Implicit: Auto-selected based on description matching (unless `allow_implicit_invocation: false`)
- **Management:** `$skill-creator` (create), `$skill-installer` (install from repos)
- **Progressive disclosure:** Metadata loaded at startup, full SKILL.md loaded on activation

### TASKS -- VIA AGENTS SDK
- **No native task primitive in CLI itself**
- **Agents SDK integration:** Enables deterministic, auditable workflows
  - Task DAGs, hand-offs, traces of agent actions
  - Orchestration via MCP server pattern

### COMMANDS -- VIA $ PREFIX
- **No `.codex/commands/` directory**
- **Skills serve as commands** via `$skill-name` invocation
- **Built-in:** `$skill-creator`, `$skill-installer`, `$create-plan` (experimental)

### Directory Structure Summary
```
.agents/
  skills/            # Repository skills (Agent Skills standard)
~/.codex/
  AGENTS.md          # Global custom instructions
  AGENTS.override.md # Override instructions
  config.toml        # CLI configuration
~/.agents/
  skills/            # User-level skills
AGENTS.md            # Project-level instructions
```

---

## 3. Codex App (OpenAI Web/Desktop)

### Overview
The Codex App is a separate product from the CLI -- a desktop application (macOS, Apple Silicon) and cloud interface (chatgpt.com/codex) for running agent threads in parallel.

### Differences from CLI
| Aspect | Codex CLI | Codex App |
|--------|-----------|-----------|
| Platform | macOS, Linux (Windows experimental) | macOS (Apple Silicon) + cloud |
| Interface | Terminal TUI | Desktop GUI with project sidebar |
| Parallelism | Single agent (multi via Agents SDK) | Native parallel threads |
| Worktrees | Manual or SDK-managed | Built-in worktrees |
| Skills | YES (same standard) | YES (same standard) |
| Open Source | YES (Rust) | NO |

### AGENTS -- NATIVE PARALLEL THREADS
- Desktop app supports running multiple agent threads in parallel
- Each thread has its own context and can work on different tasks simultaneously
- Built-in worktrees and cloud environments for isolation

### SKILLS -- SAME AS CLI
- Shares the same Agent Skills standard as Codex CLI
- Same discovery paths and SKILL.md format
- Available in both CLI and app interfaces

### TASKS/COMMANDS -- SAME AS CLI
- Thread-based task management in the app interface
- `$skill-name` invocation works the same way

---

## 4. Gemini CLI (Google)

### Overview
Google's open-source CLI agent for Gemini. Has adopted the Agent Skills standard and has a mature Extensions system with custom TOML-based commands. No native agent persona system.

### AGENTS -- NO NATIVE AGENT SYSTEM
- **No `.gemini/agents/` directory**
- **No persistent agent personas or memory**
- Agent behavior is shaped through `GEMINI.md` files (context instructions) and Extensions

### SKILLS -- NATIVE (Agent Skills Standard)
- **Definition locations (precedence: Workspace > User > Extension):**
  - `.gemini/skills/<skill-name>/SKILL.md` (workspace/project)
  - `~/.gemini/skills/<skill-name>/SKILL.md` (user-level, all workspaces)
  - Extension-bundled skills (within extension directories)
- **File format:** `SKILL.md` with YAML frontmatter (Agent Skills standard)
- **Activation:** Gemini autonomously decides via `activate_skill` tool based on description matching
- **Supporting directories:** `scripts/`, `references/`, `assets/`
- **Progressive disclosure:** Only metadata loaded initially, full SKILL.md on activation

### TASKS -- NO NATIVE TASK SYSTEM
- No task primitives, DAGs, or workflow definitions
- Tasks are implicit in skill instructions

### COMMANDS -- NATIVE (TOML Format, Unique to Gemini)
- **Definition locations:**
  - `~/.gemini/commands/<name>.toml` (global)
  - `<project>/.gemini/commands/<name>.toml` (project-specific)
- **Naming:** Subdirectories create namespaced commands (e.g., `git/commit.toml` becomes `/git:commit`)
- **TOML format:**
  ```toml
  description = "One-line explanation"
  prompt = """Your prompt template here.
  Use {{args}} for argument injection.
  Use !{git diff} for shell command output.
  Use @{docs/file.md} for file content injection."""
  ```
- **Features:** `{{args}}` substitution, `!{command}` shell execution, `@{file}` content injection
- **Reload:** `/commands reload` to pick up changes without restart

### EXTENSIONS -- NATIVE (Gemini-Specific)
- **Location:** `~/.gemini/extensions/`
- **Definition:** `gemini-extension.json` manifest file per extension
- **Bundles:** Prompts, MCP servers, custom commands, and skills
- **Extensions can provide:** Commands (TOML), skills (SKILL.md), and MCP server configurations

### Directory Structure Summary
```
.gemini/
  skills/           # Workspace skills (Agent Skills standard)
  commands/         # Project TOML commands
  GEMINI.md         # Project context instructions
  .env              # Project environment variables
~/.gemini/
  skills/           # User-level skills
  commands/         # Global TOML commands
  extensions/       # Installed extensions
  GEMINI.md         # Global context instructions
  .env              # Global environment variables
```

---

## 5. Antigravity (Google)

### Overview
Google Antigravity is a new "agent-first" IDE platform (public preview, free for individuals) combining a coding experience with autonomous agent capabilities. It uses Gemini 3 Pro by default but also supports Claude Sonnet 4.5 and GPT models.

### AGENTS -- NATIVE (Agent-First Architecture)
- Antigravity is built around agents as first-class citizens
- Agents autonomously plan, execute, and verify complex tasks across editor, terminal, and browser
- Generates **Artifacts** -- tangible deliverables (task lists, implementation plans, screenshots, browser recordings)
- Agent can interact with local files, execute Python/Bash scripts, connect to external APIs

### SKILLS -- NATIVE (Agent Skills Standard)
- Follows the Agent Skills open standard (Google formally integrated in January 2026)
- Skills are modular, file-based capability extensions
- **Key characteristic:** Ephemeral loading -- instructions and scripts loaded only when semantically relevant
- **Ecosystem:** 800+ community skills available (shared with Claude Code and Cursor ecosystems)
- **Activation:** AI determines semantic relevance and loads on-demand
- Optimizes context window through progressive disclosure

### TASKS -- NATIVE (Artifacts System)
- Artifacts serve as task outputs: task lists, implementation plans, test results
- Agents generate and verify Artifacts autonomously
- User can verify agent logic through Artifact inspection

### COMMANDS -- NO DOCUMENTED NATIVE SYSTEM
- No evidence of a custom commands directory or TOML/MD command format
- Agent interaction is primarily through natural language and skill activation

### Directory Structure Summary
```
.agents/
  skills/           # Agent Skills standard (shared with Codex, Copilot)
```
*Note: Antigravity's full directory convention is less documented than other platforms as of February 2026.*

---

## 6. Cursor

### Overview
Cursor IDE has a powerful Agent mode with subagent decomposition and supports both its legacy `.cursorrules` system and the new Agent Skills standard. It does NOT have native persistent agent personas.

### AGENTS -- NO NATIVE PERSISTENT AGENTS
- **No `.cursor/agents/` directory**
- **Agent mode** decomposes tasks into specialized subagents automatically:
  - Terminal Subagent (runs commands)
  - Docs Subagent (scans documentation)
  - Test Subagent (runs and writes tests)
  - Refactor Subagent (code changes)
- These subagents are system-managed, NOT user-definable
- No persistent agent memory system

### SKILLS -- NATIVE (Agent Skills Standard)
- **Definition location:** `.cursor/skills/<skill-name>/SKILL.md`
- **File format:** YAML frontmatter + Markdown body (Agent Skills standard)
- **Activation:** Auto-invoked when description matches task; no explicit `$` or `/` prefix documented
- **Supporting files:** `references/`, `scripts/`
- **Ecosystem:** Compatible with skills built for Claude Code, Antigravity, Codex

### TASKS -- NO NATIVE TASK SYSTEM
- No task file format, DAGs, or workflow definitions
- Agent mode implicitly creates task plans but these are not user-configurable

### COMMANDS -- NATIVE (Custom /commands)
- **Custom commands:** Defined via `.cursor/rules/` directory or command configurations
- **Format:** Markdown `.mdc` files (Cursor rule files)
- **Examples:** `/plan`, `/refactor`, `/test`, `/review`
- **Rules system:** `.cursor/rules/` with different scopes (global, file-specific)

### RULES -- NATIVE (Legacy + Current)
- **Legacy:** `.cursorrules` file in project root (still works)
- **Current:** `.cursor/rules/*.mdc` files with metadata and scoping
- Rules are behavioral guidelines (always-on or triggered)
- Skills are procedural workflows (on-demand)

### Directory Structure Summary
```
.cursor/
  skills/           # Agent Skills standard
  rules/            # Cursor rule files (.mdc format)
.cursorrules        # Legacy rules file (still functional)
```

---

## 7. Windsurf (Codeium)

### Overview
Windsurf's Cascade is an agentic assistant that plans multi-step edits, calls tools, and uses deep repo context. As of February 2026, Windsurf has adopted the Agent Skills standard alongside its existing Rules system.

### AGENTS -- NO NATIVE PERSISTENT AGENTS
- **No agent persona definitions**
- Cascade is the single agent -- no multi-agent or custom agent persona system
- No persistent agent memory across sessions

### SKILLS -- NATIVE (Agent Skills Standard, Added Feb 12, 2026)
- **Definition locations:**
  - `.windsurf/skills/<skill-name>/SKILL.md` (workspace)
  - `~/.codeium/windsurf/skills/<skill-name>/SKILL.md` (global)
  - `.agents/skills/` (cross-platform standard, added Feb 12, 2026)
- **File format:** YAML frontmatter (`name`, `description`) + Markdown body
- **Activation:**
  - Automatic: Cascade invokes when description matches request (progressive disclosure)
  - Manual: `@skill-name` mention
- **Supporting files:** Scripts, templates, configs alongside SKILL.md

### TASKS -- NO NATIVE TASK SYSTEM
- No task file format or workflow definitions
- Cascade internally plans multi-step operations but these are not user-configurable

### COMMANDS -- NO NATIVE COMMANDS (Rules Only)
- **No custom slash commands directory**
- Uses Rules system instead

### RULES -- NATIVE
- **Location:** `.windsurf/rules/` (workspace rules)
- **Limit:** 6,000 characters per rule file
- **Types:** Always-on, @mention-able, requested by Cascade, or glob-attached
- **Distinction from skills:** Rules influence behavior across conversations; skills are invoked for specific procedures

### Directory Structure Summary
```
.windsurf/
  skills/           # Workspace skills (Agent Skills standard)
  rules/            # Behavioral rules (Markdown)
.agents/
  skills/           # Cross-platform skills (added Feb 2026)
~/.codeium/windsurf/
  skills/           # Global skills
```

---

## 8. GitHub Copilot

### Overview
GitHub Copilot has a comprehensive implementation with BOTH native custom agents AND the Agent Skills standard. It operates across VS Code, CLI, and the GitHub.com coding agent.

### AGENTS -- NATIVE (.github/agents/)
- **Definition location:** `.github/agents/<name>.agent.md` (repository)
  - Organization/enterprise: root `agents/` in `.github-private` repository
- **File format:** Markdown with YAML frontmatter
- **Key frontmatter fields:**
  - `name` (optional, defaults to filename)
  - `description` (required)
  - `tools` (optional, list of available tools)
  - `mcp-servers` (optional, org/enterprise only)
  - `model` (optional, for IDE environments)
  - `target` (optional, `vscode` or `github-copilot`)
- **Body:** Up to 30,000 characters of behavioral instructions
- **Persistent memory:** No native cross-session memory system
- **Activation:** Selected from agent dropdown in IDE chat windows or GitHub.com agent tab
- **Distinction from skills:** Agents are persistent profiles for end-to-end workflows; skills are on-demand capabilities

### SKILLS -- NATIVE (Agent Skills Standard)
- **Definition locations:**
  - `.github/skills/<skill-name>/SKILL.md` (repository)
  - `.claude/skills/` (also scanned, for cross-platform compatibility)
  - `~/.copilot/skills/` or `~/.claude/skills/` (personal, CLI + coding agent only)
- **File format:** SKILL.md with YAML frontmatter (Agent Skills standard)
- **Platform support:** Copilot coding agent, GitHub Copilot CLI, VS Code Insiders (stable VS Code "coming soon")
- **Activation:** Copilot auto-loads when relevant based on description

### TASKS -- VIA CODING AGENT
- The Copilot coding agent (on GitHub.com) autonomously works on issues/tasks
- Creates branches, makes changes, runs tests, opens PRs
- Not a user-configurable task file format

### COMMANDS -- NO NATIVE CUSTOM COMMANDS
- Built-in commands in IDE chat (not user-extensible as slash commands)
- Custom instructions via `.github/copilot-instructions.md` (repository-level)

### Custom Instructions
- **Location:** `.github/copilot-instructions.md`
- **Purpose:** Project-specific guidance for Copilot (build commands, coding patterns, test strategies)
- **Format:** Natural language Markdown
- **Not a command system** -- always-on context instructions

### Directory Structure Summary
```
.github/
  agents/                  # Custom agent profiles (*.agent.md)
  skills/                  # Repository skills (Agent Skills standard)
  copilot-instructions.md  # Repository custom instructions
~/.copilot/
  skills/                  # Personal skills (coding agent + CLI)
```

---

## 9. Cline / Continue.dev

### Cline

#### Overview
Cline is an autonomous VS Code extension (4M+ developers) with a human-in-the-loop design. It has adopted its own skills system and supports MCP for extensibility.

#### AGENTS -- NO NATIVE PERSISTENT AGENTS
- **No agent persona definitions**
- **Custom Modes** provide behavioral profiles but are not persistent agent personas with memory
- Supports Agent Client Protocol (ACP) for connecting to external agents (JetBrains, Neovim, Zed)

#### SKILLS -- NATIVE (Own Format + Compatible)
- **Definition locations:**
  - `~/.cline/.skills/` (global)
  - `<workspace>/.cline/.skills/` (project-specific)
- **File format:** Plain Markdown files (`.md` extension)
  - No YAML frontmatter required (unlike Agent Skills standard)
  - Filename (without .md) becomes the skill identifier
- **Activation:** `/skill <skill-name>` slash command (manual only, no auto-invocation)
- **Injection method:** Skill content injected into current API request as user message (not system prompt)
- **Workspace overrides global** when names collide
- **Auto-discovery:** `discoverSkills()` scans both directories, builds registry for autocomplete
- **Note:** Also reads `.agents/skills/` for cross-platform Agent Skills standard compatibility

#### TASKS -- NO NATIVE TASK SYSTEM
- Cline operates on a single-task, step-by-step model with human approval
- No DAG, workflow, or task file format

#### COMMANDS -- SLASH COMMANDS (Limited)
- `/skill <name>` is the primary custom command mechanism
- No custom command definition files

#### RULES -- NATIVE
- **Location:** `.clinerules/` directory
- **Distinction:** Rules are always in system prompt; skills are on-demand via slash command

### Continue.dev

#### Overview
Continue is a highly configurable VS Code/JetBrains extension with a Hub for sharing agents and blocks. It takes a different architectural approach centered on composable "blocks."

#### AGENTS -- NATIVE (Hub Agents)
- **Definition:** `config.yaml` or via Continue Hub interface
- **Composition:** Agents are composed of models, rules, and tools (MCP servers)
- **Hub:** Central public repository for sharing agents and building blocks
- **Creation:** "Create agent" in sidebar, add/remove blocks
- **Governance:** Allow/block lists for blocks and agents (enterprise feature)
- **Persistent memory:** No native cross-session agent memory

#### SKILLS -- PARTIAL (Via Blocks)
- Continue uses "blocks" rather than the Agent Skills standard
- Blocks include: prompts, rules, integrations, model configs
- Some skill-like blocks exist (e.g., `cn-check` for code checks)
- **Not directly compatible** with the Agent Skills SKILL.md standard

#### TASKS -- NO NATIVE TASK SYSTEM
- No task file format or workflow definitions

#### COMMANDS -- NO NATIVE COMMANDS
- No custom slash command system
- Interaction through agent chat interface

#### Directory Structure
```
# Continue.dev
~/.continue/
  config.yaml          # Main configuration
# Or via Continue Hub (cloud-managed)
```

---

## 10. JetBrains AI

### Overview
JetBrains has taken a protocol-first approach with ACP (Agent Client Protocol), developed jointly with Zed. Their agent Junie handles autonomous coding tasks. The Agent Skills Manager plugin provides skills support.

### AGENTS -- VIA ACP PROTOCOL
- **ACP (Agent Client Protocol):** Open standard for IDE-agent communication
  - Jointly developed with Zed
  - Configuration: `~/.jetbrains/acp.json`
  - ACP Agent Registry: Discover and install agents from January 2026
- **Junie:** JetBrains' native coding agent
  - Autonomously plans and executes complex multi-step actions
  - Large-scale edits, tests, terminal commands, external tools
  - Available as GitHub Action for CI/CD
- **Custom agents:** Any ACP-compatible agent can be added
  - Settings > Tools > AI Assistant > Agents
  - Or via agent picker menu > "Install From ACP Registry"
- **Persistent memory:** No native agent memory system

### SKILLS -- VIA PLUGIN (Agent Skills Manager)
- **Agent Skills Manager plugin** available on JetBrains Marketplace
  - Transforms IDE into a "skills server" for AI assistants
- **Built-in skill creator:** `$$skill-creator` command
- **Not natively integrated** into JetBrains AI Assistant core
- Cross-platform SKILL.md files can be used via the plugin

### TASKS -- VIA JUNIE
- Junie handles task execution autonomously
- No user-configurable task file format

### COMMANDS -- NO NATIVE CUSTOM COMMANDS
- Custom prompts via AI Chat interface
- No command file format or slash command definitions

### PROTOCOLS -- ACP + MCP
- **ACP:** Agent-to-IDE communication
- **MCP:** Model Context Protocol for tool/data access
  - Supported natively in AI Assistant
  - Configure via Settings > Tools > AI Assistant > MCP

### Directory Structure Summary
```
~/.jetbrains/
  acp.json            # ACP agent configuration
# Plugin-based:
.agents/
  skills/             # Via Agent Skills Manager plugin
```

---

## Cross-Platform Analysis

### The Agent Skills Open Standard

The Agent Skills standard (`agentskills.io`) has become the universal primitive for extending AI coding assistants. Key details:

- **Published:** October 16, 2025 (Anthropic), formalized December 18, 2025
- **Adopters (confirmed Feb 2026):** Anthropic (Claude Code), OpenAI (Codex), Google (Gemini CLI, Antigravity), Microsoft (GitHub Copilot, VS Code), Cursor, Windsurf, Cline, and 20+ others
- **Package manager:** Vercel's `skills.sh` (launched January 2026)
- **Core spec:**
  ```
  skill-name/
    SKILL.md           # Required (YAML frontmatter + Markdown)
    scripts/           # Optional executables
    references/        # Optional documentation
    assets/            # Optional static resources
  ```
- **Required frontmatter:** `name` (max 64 chars, lowercase+hyphens), `description` (max 1024 chars)
- **Optional frontmatter:** `license`, `compatibility`, `metadata`, `allowed-tools`
- **Progressive disclosure:** Only metadata loaded at startup; full content on activation

### Universal Skills Directory

Multiple platforms scan `.agents/skills/` as a cross-platform convention:
- Codex CLI: `$CWD/.agents/skills/`, `$REPO_ROOT/.agents/skills/`
- Windsurf: `.agents/skills/` (added Feb 12, 2026)
- Cline: `.agents/skills/` (compatibility layer)
- GitHub Copilot: `.github/skills/` and `.agents/skills/`

### Platform-Specific Skill Directories

| Platform | Primary Location | Fallback/Additional |
|----------|-----------------|---------------------|
| Claude Code | `.claude/skills/` | `.claude/commands/` (legacy) |
| Codex CLI | `.agents/skills/` | `~/.agents/skills/`, `/etc/codex/skills` |
| Gemini CLI | `.gemini/skills/` | `~/.gemini/skills/`, extension-bundled |
| Antigravity | `.agents/skills/` | -- |
| Cursor | `.cursor/skills/` | -- |
| Windsurf | `.windsurf/skills/` | `.agents/skills/`, `~/.codeium/windsurf/skills/` |
| GitHub Copilot | `.github/skills/` | `~/.copilot/skills/`, `.claude/skills/` |
| Cline | `.cline/.skills/` | `.agents/skills/` |
| JetBrains | Via plugin | `.agents/skills/` |

### Agents Comparison

Only THREE platforms have true native agent definitions (persistent personas with configuration):

1. **Claude Code** -- `.claude/agents/` (richest: memory, hooks, tools, skills, models, permissions)
2. **GitHub Copilot** -- `.github/agents/*.agent.md` (tools, MCP, model, instructions)
3. **Continue.dev** -- Hub agents via `config.yaml` (models, rules, tools)

Other platforms handle "agents" through:
- **Codex:** External Agents SDK orchestration
- **JetBrains:** ACP protocol for external agent connection
- **Cline:** Custom modes (behavioral, not persona-based)
- **Cursor/Windsurf/Gemini CLI/Antigravity:** No user-definable agent personas

### Commands Comparison

| Platform | Format | Location | Invocation |
|----------|--------|----------|------------|
| Claude Code | Markdown | `.claude/commands/` (merged into skills) | `/command-name` |
| Codex CLI | Via skills | `.agents/skills/` | `$skill-name` |
| Gemini CLI | TOML | `.gemini/commands/` | `/command-name` |
| Cursor | MDC | `.cursor/rules/` | `/command-name` |
| Cline | Markdown | `.cline/.skills/` | `/skill name` |
| Others | N/A | N/A | N/A |

---

## Strategic Implications for AIOS

### Opportunity: `.agents/skills/` as Universal Directory
The `.agents/skills/` directory is emerging as the cross-platform convention. AIOS could:
1. Generate skills into `.agents/skills/` for maximum portability
2. Maintain IDE-specific symlinks/copies for platforms that only scan their own directory
3. Use the `ideSync` system to distribute from a single source

### Opportunity: Agent Definitions are NOT Standardized
Unlike skills, there is NO cross-platform agent standard. Each platform (Claude Code, GitHub Copilot, Continue) has its own format. AIOS's agent system (`.aios-core/development/agents/`) already solves this problem with the `ideSync` system that transforms agents into platform-specific formats.

### Risk: Commands are Fragmenting
Each platform has a different command format (Markdown, TOML, MDC, none). The industry trend is toward merging commands into skills (Claude Code already did this). AIOS should prepare for this convergence.

### Recommendation: Skill-First Architecture
Given the universal adoption of the Agent Skills standard, AIOS should consider a "Skill-First" approach where:
1. Core capabilities are packaged as Agent Skills (SKILL.md)
2. Skills are distributed to all supported IDEs via `ideSync`
3. Platform-specific agent definitions wrap skills with personas and context
4. The `.agents/skills/` directory serves as the universal deployment target

---

## Sources

### Official Documentation
- [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills)
- [Claude Code Subagents Documentation](https://code.claude.com/docs/en/sub-agents)
- [Claude Code Agent Teams Documentation](https://code.claude.com/docs/en/agent-teams)
- [OpenAI Codex Agent Skills](https://developers.openai.com/codex/skills/)
- [OpenAI Codex CLI Documentation](https://developers.openai.com/codex/cli/)
- [OpenAI Codex AGENTS.md Guide](https://developers.openai.com/codex/guides/agents-md/)
- [Gemini CLI Skills](https://geminicli.com/docs/cli/skills/)
- [Gemini CLI Custom Commands](https://geminicli.com/docs/cli/custom-commands/)
- [Gemini CLI Extensions](https://geminicli.com/docs/cli/tutorials/skills-getting-started/)
- [Google Antigravity Developer Blog](https://developers.googleblog.com/build-with-google-antigravity-our-new-agentic-development-platform/)
- [GitHub Copilot Agent Skills](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills)
- [GitHub Copilot Custom Agents](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/create-custom-agents)
- [VS Code Agent Skills](https://code.visualstudio.com/docs/copilot/customization/agent-skills)
- [Windsurf Cascade Skills](https://docs.windsurf.com/windsurf/cascade/skills)
- [Cline Skills System (DeepWiki)](https://deepwiki.com/cline/cline/7.4-skills-system)
- [Continue.dev Customization](https://docs.continue.dev/customize/overview)
- [JetBrains ACP Documentation](https://www.jetbrains.com/help/ai-assistant/acp.html)
- [JetBrains Agent Skills Manager Plugin](https://plugins.jetbrains.com/plugin/29975-agent-skills-manager)
- [Agent Skills Specification](https://agentskills.io/specification)

### Industry Analysis
- [Agent Skills: Anthropic's Next Bid to Define AI Standards (The New Stack)](https://thenewstack.io/agent-skills-anthropics-next-bid-to-define-ai-standards/)
- [skill.md: An open standard for agent skills (Mintlify)](https://www.mintlify.com/blog/skill-md)
- [Codex CLI & Agent Skills Guide (ITECS)](https://itecsonline.com/post/codex-cli-agent-skills-guide-install-usage-cross-platform-resources-2026)
- [Gemini CLI Adds Agent Skills (The Context Layer)](https://medium.com/the-context-layer/gemini-cli-adds-agent-skills-and-your-terminal-starts-acting-like-an-agent-runtime-63a5d9cb0371)
- [Claude Code Agent Teams (Addy Osmani)](https://addyosmani.com/blog/claude-code-agent-teams/)
- [Building Consistent Workflows with Codex CLI & Agents SDK (OpenAI Cookbook)](https://cookbook.openai.com/examples/codex/codex_mcp_agents_sdk/building_consistent_workflows_codex_cli_agents_sdk)
- [GitHub Copilot Agent Skills Guide (SmartScope)](https://smartscope.blog/en/generative-ai/github-copilot/github-copilot-skills-guide/)
- [Mastering Google Antigravity Skills (VERTU)](https://vertu.com/lifestyle/mastering-google-antigravity-skills-a-comprehensive-guide-to-agentic-extensions-in-2026/)
- [JetBrains ACP Agent Registry (JetBrains Blog)](https://blog.jetbrains.com/ai/2026/01/acp-agent-registry/)
- [VS Code vs Cursor 2026 (MarkAICode)](https://markaicode.com/vscode-vs-cursor-2026-comparison/)
- [Claude Code Release Notes (Releasebot)](https://releasebot.io/updates/anthropic/claude-code)
- [Microsoft Skills Repository (GitHub)](https://github.com/microsoft/skills)
- [Claude Code Merges Slash Commands Into Skills (Medium)](https://medium.com/@joe.njenga/claude-code-merges-slash-commands-into-skills-dont-miss-your-update-8296f3989697)
- [Configure Claude Code Agent Team (Medium)](https://medium.com/@haberlah/configure-claude-code-to-power-your-agent-team-90c8d3bca392)
