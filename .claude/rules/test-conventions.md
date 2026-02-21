---
globs: tests/**
---
# Test Conventions (Migrated from CLAUDE.md - AGF-6)

## Test Commands

```bash
npm test                    # Run all tests
npm run test:coverage       # Tests with coverage report
npm run lint                # ESLint check
```

## Quality Gates (Pre-Push)

All checks must pass before push:
```bash
npm run lint        # ESLint — zero errors
npm test            # Jest — zero failures
```

## Test Structure

- Unit tests: `tests/unit/`
- Integration tests: `tests/integration/`
- E2E tests: `tests/{feature}/e2e/`
- Test files use `.test.js` suffix

## Test Skipping Policy

When deprecating tests, use `describe.skip` with a comment:
```js
// @deprecated {STORY-ID}: {reason}
describe.skip('...', () => {
```

Do NOT silently delete tests — they serve as documentation of what was tested.
