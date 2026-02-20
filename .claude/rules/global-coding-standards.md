---
description: Global coding standards applied to all prompts. Migrated from .synapse/global (L1).
---
# Global Coding Standards (L1)

Universal rules applied to ALL development work.

## Syntax and Style

- Use ES2022 syntax with CommonJS modules (require/module.exports)
- 2-space indentation, single quotes, semicolons required
- Files use kebab-case naming, components use PascalCase, constants use SCREAMING_SNAKE_CASE

## Import Rules (Constitution Article VI)

- Always use absolute imports with @/ alias — never relative imports (../../..)
- Import order: core libraries, external libs, UI components, utilities, stores, features, CSS

## TypeScript Rules

- No any type — use appropriate types or unknown with type guards
- Always define interface for component props

## Error Handling

- Wrap operations in try/catch with descriptive error messages including context
- Log errors with logger.error before re-throwing with context

## Quality Standards

- All code must pass npm run lint, npm run typecheck, and npm test before completion
- Zero external dependencies unless explicitly approved — prefer Node.js stdlib
