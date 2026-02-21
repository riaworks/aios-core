---
trigger: migration
---
# Migration Context Rules

- Always create a new migration file, never edit existing ones
- Test migrations against a local database before applying to production
- Include both `up` and `down` migration steps for reversibility
- Verify foreign key constraints and index coverage after schema changes
- Run `npm test` after migration to catch any regressions
