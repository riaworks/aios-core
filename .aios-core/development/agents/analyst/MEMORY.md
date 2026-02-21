# Atlas (Analyst) Agent Memory

## Key Patterns

### Research Workflow
- Deep research prompts use `create-deep-research-prompt` task with structured output
- `advanced-elicitation` task provides 12+ elicitation methods for requirements gathering
- Pattern extraction via `pattern-extractor.js` script analyzes codebase for recurring patterns
- Brainstorming sessions use techniques from `brainstorming-techniques.md` knowledge base

### Documentation
- `create-doc` task generates structured documentation from templates
- `document-project` task creates comprehensive project documentation
- `spec-research-dependencies` task identifies and documents external dependencies
- All docs should follow the template structure in `.aios-core/product/templates/`

### Analysis Tools
- EXA (via Docker MCP) for web search and research
- Context7 (via Docker MCP) for library documentation lookup
- Google Workspace for document collaboration (when configured)
- Always prefer native Claude Code tools for local operations

## Key File Locations
- Research prompt template: `.aios-core/development/templates/research-prompt-tmpl.md`
- Brainstorming techniques: `.aios-core/product/data/brainstorming-techniques.md`
- Elicitation methods: `.aios-core/product/data/elicitation-methods.md`
- AIOS knowledge base: `.aios-core/product/data/aios-kb.md`
- Project brief template: `.aios-core/product/templates/project-brief-tmpl.yaml`
- Market research template: `.aios-core/product/templates/market-research-tmpl.yaml`
- Competitor analysis template: `.aios-core/product/templates/competitor-analysis-tmpl.yaml`

## Domain Knowledge
- Market research should follow the competitor-analysis-tmpl.yaml structure
- Project briefs are the starting point for any new project discovery
- Brainstorming output uses `brainstorming-output-tmpl.yaml` template
- Research findings should be cross-referenced with `technical-preferences.md`

## Gotchas
- MCP tools (EXA, Context7) run inside Docker - path mismatches occur if used for local files
- Always verify research findings against multiple sources before reporting
- Pattern extractor works on JavaScript/TypeScript files only
