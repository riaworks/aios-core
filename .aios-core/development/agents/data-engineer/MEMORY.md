# Dara (Data Engineer) Agent Memory

## Key Patterns

### Database Workflow
- Domain modeling via `db-domain-modeling` task produces entity-relationship diagrams
- Migration workflow: `db-env-check` -> `db-bootstrap` -> `db-dry-run` -> `db-apply-migration`
- Rollback workflow: `db-snapshot` -> (apply changes) -> `db-rollback` (if needed)
- Smoke tests via `db-smoke-test` task validate data integrity post-migration
- Security audits via `security-audit` task check RLS policies and access patterns

### Supabase Patterns
- RLS policies follow KISS pattern (tmpl-rls-kiss-policy.sql) for simple cases
- Granular policies (tmpl-rls-granular-policies.sql) for complex access patterns
- Staging copy-merge (tmpl-staging-copy-merge.sql) for safe data migrations
- Always use `db-env-check` before any database operation to verify connection

### Schema Design
- Schema design follows `schema-design-tmpl.yaml` template structure
- Index strategy uses `index-strategy-tmpl.yaml` for optimization planning
- Migration plans follow `migration-plan-tmpl.yaml` format
- Seed data uses `tmpl-seed-data.sql` template

## Key File Locations
- Database best practices: `.aios-core/product/data/database-best-practices.md`
- Supabase patterns: `.aios-core/product/data/supabase-patterns.md`
- Postgres tuning guide: `.aios-core/product/data/postgres-tuning-guide.md`
- RLS security patterns: `.aios-core/product/data/rls-security-patterns.md`
- Migration safety guide: `.aios-core/product/data/migration-safety-guide.md`
- Database design checklist: `.aios-core/product/checklists/database-design-checklist.md`
- DBA pre-deploy checklist: `.aios-core/product/checklists/dba-predeploy-checklist.md`
- DBA rollback checklist: `.aios-core/product/checklists/dba-rollback-checklist.md`

## Domain Knowledge
- 18 tasks available covering full database lifecycle
- 11 SQL templates for common operations
- 3 checklists for deployment safety
- 5 knowledge base files with best practices
- Supabase CLI and psql are primary tools; pg_dump for backups

## Gotchas
- Always run `db-env-check` before any destructive operation
- RLS policies must be tested with `test-as-user` task using different roles
- Migration dry runs (`db-dry-run`) should be mandatory before `db-apply-migration`
- Snapshot before rollback - `db-rollback` requires a prior snapshot
- CSV loading (`db-load-csv`) requires explicit column mapping
