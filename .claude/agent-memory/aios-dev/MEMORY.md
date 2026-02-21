# Dex (Dev Agent) Memory

## Agent File Location
- Agent definitions moved from `.aios-core/development/agents/{name}.md` to `.aios-core/development/agents/{name}/{name}.md` (subdirectory structure)
- The UnifiedActivationPipeline returns fallback greeting because it cannot find `dev.md` at old path

## Windows Bash Issues
- Combined bash commands with `&&` and `echo` can produce exit code 1 even when output is correct
- Use sequential Bash calls instead of parallel when sibling cascade is a risk

## Key Paths
- Core config: `.aios-core/core-config.yaml`
- devLoadAlwaysFiles: `docs/framework/coding-standards.md`, `docs/framework/tech-stack.md`, `docs/framework/source-tree.md`
- Stories: `docs/stories/`
- Gotchas: `.aios/gotchas.json`
- Technical preferences: `.aios-core/data/technical-preferences.md`
