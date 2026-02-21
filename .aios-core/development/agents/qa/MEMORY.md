# Quinn (QA) Agent Memory

## Key Patterns

### Quality Gate Process
- `qa-gate` task is the primary quality gate decision mechanism
- Gate template: `qa-gate-tmpl.yaml` defines the structure for gate reports
- Gate decisions: PASS (proceed), CONCERNS (proceed with notes), FAIL (block)
- Advisory role only - QA recommends but does not block autonomously

### Test Architecture
- `qa-test-design` task creates test strategy from requirements
- `qa-generate-tests` task produces test code from specifications
- `create-suite` task scaffolds new test suites
- Test levels defined in `.aios-core/product/data/test-levels.md`
- Test priorities defined in `.aios-core/product/data/test-priorities.md`

### Review Types
- `qa-review-story` - Story-level review (acceptance criteria coverage)
- `qa-review-build` - Build-level review (integration, regression)
- `qa-review-proposal` - Proposal review (architecture, design decisions)
- `qa-risk-profile` - Risk assessment for changes
- `code-review` - Code quality and best practices review

### Security & Validation
- `qa-security-checklist` - Security vulnerability scanning
- `qa-library-validation` - Third-party library safety check
- `qa-migration-validation` - Data migration integrity verification
- `qa-evidence-requirements` - Evidence collection for compliance
- `qa-false-positive-detection` - Identifies false positive test results
- `qa-browser-console-check` - Browser console error detection

### Specialized Tasks
- `qa-nfr-assess` - Non-functional requirements assessment
- `qa-trace-requirements` - Requirements traceability matrix
- `qa-create-fix-request` - Generates structured fix requests for @dev
- `spec-critique` - Specification quality review

## Key File Locations
- QA gate template: `.aios-core/product/templates/qa-gate-tmpl.yaml`
- Story template: `.aios-core/product/templates/story-tmpl.yaml`
- Technical preferences: `.aios-core/product/data/technical-preferences.md`
- Quality gate config: `.aios-core/core/quality-gates/quality-gate-config.yaml`
- Agent path in quality gate: `qa/qa.md` (updated from flat path)

## Domain Knowledge
- 20 tasks covering comprehensive quality assurance lifecycle
- Advisory role: recommends improvements, does not implement code
- Test commands: `npm test`, `npm run test:coverage`, `npm run lint`, `npm run typecheck`
- Pre-push quality gate: lint + typecheck + test (all must pass)
- Quality dimensions framework at `.aios-core/development/data/quality-dimensions-framework.md`

## Gotchas
- QA agent is READ-ONLY for code - use `qa-create-fix-request` to delegate fixes to @dev
- Browser console check requires playwright MCP (only use when explicitly needed)
- Pre-existing test failures in squads/mmos-squad/ (missing clickup) and tests/core/orchestration/ are known
- Pre-existing lint: 279 errors, 860 warnings across the codebase
- Always run full test suite, not just changed files, for regression detection
