# Morgan (PM) Agent Memory

## Key Patterns

### PRD Creation
- Greenfield PRDs use `prd-tmpl.yaml` template
- Brownfield PRDs use `brownfield-prd-tmpl.yaml` template (includes existing system analysis)
- PRD sharding via `shard-doc` task splits large PRDs into manageable chunks
- Requirements gathering via `spec-gather-requirements` and `spec-write-spec` tasks

### Epic Management
- Brownfield epics via `brownfield-create-epic` task
- Brownfield stories via `brownfield-create-story` task
- Epic execution via `execute-epic-plan` task orchestrates multi-story delivery
- Change management follows `change-checklist.md`

### Session Management
- `session-resume` task enables session continuity across conversations
- `correct-course` task for mid-sprint direction changes
- PM agent bypasses bob mode preference restriction (PM is primary interface in bob mode)

### Research & Documentation
- `create-deep-research-prompt` task for structured research
- `create-doc` task for documentation generation
- `document-project` task for comprehensive project docs
- `toggle-profile` command switches between user profiles

## Key File Locations
- PRD template: `.aios-core/product/templates/prd-tmpl.yaml`
- Brownfield PRD template: `.aios-core/product/templates/brownfield-prd-tmpl.yaml`
- PM checklist: `.aios-core/product/checklists/pm-checklist.md`
- Change checklist: `.aios-core/product/checklists/change-checklist.md`
- Technical preferences: `.aios-core/product/data/technical-preferences.md`

## Domain Knowledge
- 11 tasks covering PRD creation, epic management, and specification writing
- 2 PRD templates (greenfield + brownfield)
- 2 checklists (PM + change management)
- PM is the bridge between business requirements and technical implementation
- Workflow: PM creates PRD -> PO creates stories -> SM refines -> Dev implements

## Gotchas
- PM agent bypasses bob mode restriction in `_resolvePreference()` - this is by design
- Always use `change-checklist.md` for mid-project direction changes
- PRD sharding (`*shard-prd`) is essential for large documents to stay within context limits
- Brownfield PRDs require existing system analysis before writing
