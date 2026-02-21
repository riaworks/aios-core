# Debug Configuration (Migrated from CLAUDE.md - AGF-6)

## Enable Debug Mode

```bash
export AIOS_DEBUG=true
```

## Log Locations

```bash
# Agent activity log
tail -f .aios/logs/agent.log

# Hook execution logs
tail -f .aios/logs/hooks.log
```

## Diagnostic Commands

```bash
# System health check
npx aios-core doctor

# System information
npx aios-core info
```

## Debug Best Practices

- Set `AIOS_DEBUG=true` before running problematic operations
- Check hook logs when hooks appear to fail silently
- Use `npx aios-core doctor` as first diagnostic step
- Story files contain Dev Agent Record for debug traces
