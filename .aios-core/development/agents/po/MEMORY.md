# Pax (PO) Agent Memory

## Key Patterns

### Story Management
- Stories live in `docs/stories/active/` (in-progress) and `docs/stories/completed/` (done)
- Story template: `story-tmpl.yaml` - all stories must follow this structure
- Story lifecycle: draft -> validated -> in-progress -> completed -> closed
- `po-pull-story` task imports stories from external sources
- `po-sync-story` task syncs story state across systems
- `po-close-story` task formally closes completed stories

### Backlog Management
- `po-manage-story-backlog` task is the primary backlog management tool
- Backlog operations: add, review, summary, prioritize, schedule
- `validate-next-story` task ensures the next story is ready for development
- `stories-index` command provides an overview of all stories

### Story Validation
- `validate-story-draft` verifies story structure against template
- Story DoD checklist ensures all acceptance criteria are met
- `po-master-checklist.md` covers comprehensive PO review

### Story-Driven Development Workflow
- @po *create-story -> @dev implements -> @qa tests -> @devops push
- Stories must have clear acceptance criteria before implementation starts
- Progress tracking: `[ ]` -> `[x]` checkboxes in story files
- File list section tracks all modified files

## Key File Locations
- Story template: `.aios-core/product/templates/story-tmpl.yaml`
- PO master checklist: `.aios-core/product/checklists/po-master-checklist.md`
- Change checklist: `.aios-core/product/checklists/change-checklist.md`
- Active stories: `docs/stories/active/`
- Completed stories: `docs/stories/completed/`

## Domain Knowledge
- 10 tasks covering story lifecycle management
- PO is the gatekeeper between business value and development backlog
- Acceptance criteria are the contract between PO and development team
- Sprint planning should prioritize based on business value and dependencies

## Gotchas
- ClickUp integration tasks (`po-sync-story-to-clickup`, `po-pull-story-from-clickup`) are deprecated
- Always validate story draft before assigning to development
- Story DoD checklist must pass before marking story as completed
- `correct-course` task should be used for mid-sprint pivots, not direct story edits
