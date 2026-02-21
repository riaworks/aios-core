# IDE Sync

**Story 6.19** - IDE Command Auto-Sync System
**Story TD-4** - Pre-commit Auto-Stage Integration

Automatically synchronizes AIOS agent definitions to IDE platform files.

## Overview

IDE Sync keeps agent definitions in `.aios-core/development/agents/` synchronized with IDE-specific platform files in:

- `.claude/agents/` (Claude Code native agents)
- `.claude/skills/aios-*/SKILL.md` (Claude Code agent-skills, dual-run)
- `.codex/agents/` (Codex CLI support files)
- `.gemini/rules/AIOS/agents/` (Gemini CLI)
- `packages/gemini-aios-extension/skills/aios-*/SKILL.md` (Gemini extension agent-skills, dual-run)
- `.github/agents/` (GitHub Copilot native agents, `*.agent.md`)
- `.cursor/rules/agents/` (Cursor)
- `.antigravity/rules/agents/` (Antigravity)

For Codex `/skills` activators, use the dedicated skills sync:

```bash
npm run sync:skills:codex
npm run sync:skills:codex:global
npm run sync:skills:tasks
npm run sync:skills:tasks:catalog
npm run validate:task-skills
npm run validate:task-skills:catalog
```

## Parity Contract

IDE support claims are enforced by the parity validator contract file:

- `.aios-core/infrastructure/contracts/compatibility/aios-<package.json version>.yaml`
- Current release contract: `.aios-core/infrastructure/contracts/compatibility/aios-4.2.13.yaml`

Validate contract + runtime together with:

```bash
npm run validate:parity
```

## Pre-commit Integration (Story TD-4)

The pre-commit hook automatically:

1. Runs IDE sync before each commit
2. Auto-stages any changed IDE platform files
3. Runs lint-staged for code quality

This ensures IDE platform files are always in sync with agent definitions.

### Bypass

Skip the pre-commit hook if needed (NOT recommended):

```bash
git commit --no-verify
```

## Commands

### Sync

Sync agents to all enabled IDEs:

```bash
npm run sync:ide
# or
node .aios-core/infrastructure/scripts/ide-sync/index.js sync
```

Sync specific IDE only:

```bash
npm run sync:ide:cursor
npm run sync:ide:codex
npm run sync:ide:gemini
npm run sync:ide:github-copilot
npm run sync:ide:antigravity
npm run sync:ide:claude
npm run sync:agents:claude
npm run sync:agents:github-copilot
npm run sync:skills:claude
npm run sync:skills:gemini
```

Enable additional IDEs/CLIs after initial installation:

```bash
npm run sync:ide:antigravity
npm run sync:ide:gemini
npm run sync:ide:cursor
npm run sync:ide:github-copilot
npm run sync:ide:claude
npm run sync:ide:codex
```

### Validate

Check if IDE files are in sync (report mode):

```bash
npm run sync:ide:validate
# or
node .aios-core/infrastructure/scripts/ide-sync/index.js validate
```

Strict mode (CI - exits with code 1 if drift detected):

```bash
npm run sync:ide:check
# or
node .aios-core/infrastructure/scripts/ide-sync/index.js validate --strict
```

## Options

| Option          | Description                                  |
| --------------- | -------------------------------------------- |
| `--ide <name>`  | Sync/validate specific IDE only              |
| `--strict`      | Exit with code 1 if drift detected (CI mode) |
| `--dry-run`     | Preview changes without writing files        |
| `--verbose, -v` | Show detailed output                         |
| `--quiet, -q`   | Minimal output (for pre-commit hooks)        |

## Configuration

Configure in `.aios-core/core-config.yaml`:

```yaml
ideSync:
  enabled: true
  source: .aios-core/development/agents
  targets:
    claude-code:
      enabled: true
      path: .claude/agents
      format: claude-native-agent
    claude-skills:
      enabled: true
      path: .claude/skills
      format: claude-agent-skill
    codex:
      enabled: true
      path: .codex/agents
      format: full-markdown-yaml
    gemini:
      enabled: true
      path: .gemini/rules/AIOS/agents
      format: full-markdown-yaml
    gemini-skills:
      enabled: true
      path: packages/gemini-aios-extension/skills
      format: gemini-agent-skill
    github-copilot:
      enabled: true
      path: .github/agents
      format: github-copilot-native-agent
    cursor:
      enabled: true
      path: .cursor/rules/agents
      format: condensed-rules
    # ... other IDEs
  redirects:
    aios-developer: aios-master
    db-sage: data-engineer
```

## IDE Formats

Each IDE has a specific format for agent files:

| IDE         | Format                  | Extension |
| ----------- | ----------------------- | --------- |
| Claude Code (native) | Native agent markdown | `.md` |
| Claude Code (skills) | SKILL directories | `aios-*/SKILL.md` |
| Codex CLI   | Full markdown with YAML | `.md`     |
| Gemini CLI  | Full markdown with YAML | `.md`     |
| Gemini CLI (skills) | SKILL directories | `aios-*/SKILL.md` |
| GitHub Copilot | Native agent markdown | `.agent.md` |
| Cursor      | Condensed rules         | `.md`     |
| Antigravity | Cursor-style            | `.md`     |

Platform-specific checks:

```bash
npm run validate:claude-sync
npm run validate:claude-integration
npm run validate:codex-sync
npm run validate:codex-integration
npm run validate:gemini-sync
npm run validate:gemini-integration
npm run validate:task-skills
npm run validate:task-skills:full
```

## Redirect Agents

Deprecated or renamed agents are handled via redirects. When an old agent name is requested, a redirect file is created pointing to the new agent.

Example redirect file:

```markdown
# Agent Redirect: aios-developer -> aios-master

This agent has been renamed. Use `aios-master` instead.
```

## File Structure

```
.aios-core/infrastructure/scripts/ide-sync/
├── index.js                 # Main orchestrator
├── agent-parser.js          # Parse agent YAML/MD files
├── claude-agents.js         # Claude native agent transformer
├── claude-skills.js         # Claude agent-skill transformer
├── gemini-skills.js         # Gemini agent-skill transformer + manifest sync
├── github-copilot-agents.js # GitHub Copilot native agent transformer
├── redirect-generator.js    # Generate redirect files
├── validator.js             # Validate sync status
├── README.md                # This file
└── transformers/
    ├── claude-code.js       # Claude Code format
    ├── cursor.js            # Cursor format
    └── antigravity.js       # Antigravity format
```

## Performance

IDE sync is designed to be fast:

- Typical execution: <0.2 seconds
- Pre-commit hook total: <2 seconds

## Troubleshooting

### YAML Parse Errors

Some agent files may have YAML formatting issues. The sync will continue but skip problematic files. Check the output for warnings.

### IDE Files Out of Sync

Run manual sync:

```bash
npm run sync:ide
```

### Validation Fails in CI

Ensure you run sync before committing:

```bash
npm run sync:ide && git add .
```

Or rely on the pre-commit hook to auto-stage changes.

---

**Related Stories:**

- Story 6.19: IDE Command Auto-Sync System
- Story TD-4: IDE Sync Pre-commit Auto-Stage
