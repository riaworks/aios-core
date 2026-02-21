# Craft (Squad Creator) Agent Memory

## Key Patterns

### Squad Lifecycle
- Design: `squad-creator-design` task creates squad architecture
- Create: `squad-creator-create` task scaffolds squad from design
- Validate: `squad-creator-validate` task checks squad integrity
- Publish: `squad-creator-publish` task (placeholder) for distribution
- Sync: `squad-creator-sync-synkra` task (placeholder) syncs with Synkra registry

### Squad Architecture
- Squad schema defined in `.aios-core/schemas/squad-schema.json`
- Squad design schema in `.aios-core/schemas/squad-design-schema.json`
- Squad template in `.aios-core/development/templates/squad-template/`
- Component templates in `.aios-core/development/templates/squad/`

### Squad Scripts
- `squad-loader.js` - Loads squad definitions
- `squad-validator.js` - Validates squad against schema
- `squad-generator.js` - Generates squad from template
- `squad-designer.js` - Interactive squad design
- `squad-migrator.js` - Migrates squads between versions
- `squad-analyzer.js` - Analyzes squad composition and coverage
- `squad-extender.js` - Extends existing squads with new capabilities

### Squad Structure
```
squads/{squad-name}/
├── squad.yaml           # Squad definition
├── agents/              # Squad-specific agents
├── tasks/               # Squad-specific tasks
├── workflows/           # Squad-specific workflows
└── README.md            # Squad documentation
```

## Key File Locations
- Squad schemas: `.aios-core/schemas/squad-schema.json`, `squad-design-schema.json`
- Squad scripts: `.aios-core/development/scripts/squad/`
- Squad template: `.aios-core/development/templates/squad-template/`
- Component templates: `.aios-core/development/templates/squad/`
- Existing squads: `squads/`

## Domain Knowledge
- 10 tasks covering full squad lifecycle
- 7 scripts for squad management operations
- 2 JSON schemas for validation
- Squads are self-contained agent teams with their own agents, tasks, and workflows
- Squad creation should follow the design-first approach (design -> create -> validate)

## Gotchas
- Download, publish, and sync-synkra tasks are placeholders (not yet implemented)
- squads/mmos-squad/ has known test failures due to missing clickup module
- Always validate squad against schema before publishing
- Squad agents inherit from core agent patterns but can extend with custom behaviors
