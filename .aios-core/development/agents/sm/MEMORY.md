# River (SM) Agent Memory

## Key Patterns

### Story Creation
- `create-next-story` task is the primary story creation tool
- Stories follow `story-tmpl.yaml` template structure
- Story draft checklist (`story-draft-checklist.md`) validates completeness before handoff
- SM creates stories from PRDs; does NOT implement code

### Story Validation
- `execute-checklist` task runs validation checklists
- Story draft checklist covers: title, description, acceptance criteria, file list, DoD
- Stories must have clear, testable acceptance criteria
- Each story should reference its parent epic/PRD

### Sprint Management
- `correct-course` task for mid-sprint adjustments
- SM facilitates but does not dictate - collaborative decision making
- Sprint planning prioritizes by business value + technical dependencies
- Story refinement ensures stories are small enough for single sprint

### Workflow
- SM drafts story -> PO validates -> Dev implements -> QA reviews -> DevOps pushes
- `*draft` command creates new story from PRD or epic context
- `*story-checklist` command runs the story draft validation
- SM works with git (local only) for branch management

## Key File Locations
- Story template: `.aios-core/product/templates/story-tmpl.yaml`
- Story draft checklist: `.aios-core/product/checklists/story-draft-checklist.md`
- Active stories: `docs/stories/active/`
- Completed stories: `docs/stories/completed/`

## Domain Knowledge
- 3 tasks focused on story creation and validation
- SM is the facilitator, not the decision maker
- Stories are the atomic unit of development work
- Acceptance criteria should follow Given/When/Then format when possible
- File list in stories tracks all expected file modifications

## Gotchas
- SM should NEVER implement code - only create and refine stories
- Always run story-draft-checklist before handing off to @po for validation
- Stories without clear acceptance criteria should be sent back for refinement
- Local git operations only - never push (delegate to @devops)
