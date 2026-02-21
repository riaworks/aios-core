# Git Conventions (Migrated from CLAUDE.md - AGF-6)

## Commit Messages

Follow Conventional Commits format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `test:` - Adding or updating tests
- `chore:` - Maintenance, build tools, dependencies
- `refactor:` - Code refactoring without behavior change

Always reference story ID: `feat: implement feature [Story AGF-6]`

## Branch Naming

- `main` - Primary branch (protected)
- `feat/*` - Feature branches
- `fix/*` - Bug fix branches
- `docs/*` - Documentation branches

## Push Authority

**Only `@devops` (Gage) can execute `git push` to remote.**
Other agents commit locally and notify @devops for push.

## Pre-Push Quality Gates

Before any push, verify all pass:
```bash
npm run lint
npm test
```
