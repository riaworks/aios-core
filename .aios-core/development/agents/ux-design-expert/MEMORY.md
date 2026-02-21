# Uma (UX Design Expert) Agent Memory

## Key Patterns

### Design Workflow (5 Phases)
1. **Research**: `ux-user-research` task for user research and persona creation
2. **Wireframe**: `ux-create-wireframe` task for wireframe generation
3. **Design System**: `setup-design-system` + `extract-tokens` + `bootstrap-shadcn-library`
4. **Build**: `build-component` + `compose-molecule` + `extend-pattern`
5. **Quality**: `audit-codebase` + `consolidate-patterns` + `generate-documentation`

### Design System Pipeline
- `run-design-system-pipeline` task orchestrates the full design system build
- `design-system-build-quality` workflow combines build + quality phases
- Token extraction follows `tokens-schema-tmpl.yaml` format
- DTCG export via `export-design-tokens-dtcg` task (Design Token Community Group standard)

### Component Architecture
- Atomic Design: atoms -> molecules -> organisms -> templates -> pages
- Component template: `component-react-tmpl.tsx`
- Shadcn UI library bootstrap via `bootstrap-shadcn-library` task
- State persistence template: `state-persistence-tmpl.yaml`

### Auditing & Consolidation
- `audit-codebase` task scans for design inconsistencies
- `consolidate-patterns` task merges duplicate patterns
- `generate-shock-report` produces visual diff reports (HTML)
- `calculate-roi` task measures design system investment return

### Tailwind Integration
- `tailwind-upgrade` task for Tailwind version migrations
- `audit-tailwind-config` task validates Tailwind configuration
- Token exports: CSS (`token-exports-css-tmpl.css`) and Tailwind (`token-exports-tailwind-tmpl.js`)

### Frontend Specification
- `generate-ai-frontend-prompt` task creates AI-ready frontend specs
- Front-end spec template: `front-end-spec-tmpl.yaml`
- Design story template available for design-specific stories

## Key File Locations
- Front-end spec template: `.aios-core/product/templates/front-end-spec-tmpl.yaml`
- Tokens schema template: `.aios-core/product/templates/tokens-schema-tmpl.yaml`
- Component React template: `.aios-core/product/templates/component-react-tmpl.tsx`
- Atomic design principles: `.aios-core/product/data/atomic-design-principles.md`
- Design token best practices: `.aios-core/product/data/design-token-best-practices.md`
- Consolidation algorithms: `.aios-core/product/data/consolidation-algorithms.md`
- ROI calculation guide: `.aios-core/product/data/roi-calculation-guide.md`
- Integration patterns: `.aios-core/product/data/integration-patterns.md`
- WCAG compliance guide: `.aios-core/product/data/wcag-compliance-guide.md`
- Pattern audit checklist: `.aios-core/product/checklists/pattern-audit-checklist.md`
- Component quality checklist: `.aios-core/product/checklists/component-quality-checklist.md`
- Accessibility WCAG checklist: `.aios-core/product/checklists/accessibility-wcag-checklist.md`
- Migration readiness checklist: `.aios-core/product/checklists/migration-readiness-checklist.md`

## Domain Knowledge
- 22 tasks covering full UX/UI design lifecycle
- 9 templates for design artifacts
- 4 checklists for quality assurance
- 7 knowledge base files with best practices
- Most comprehensive agent in terms of task count
- `integrate-Squad` task connects design system with squad workflows

## Gotchas
- Shock report generates HTML - requires browser for visual review
- DTCG export follows the W3C Design Token Community Group specification
- Token extraction must happen BEFORE component building
- Accessibility (WCAG) check should be run on every component, not just at the end
- `21st-dev-magic` tool is for AI-powered design generation (use sparingly)
