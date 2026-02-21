'use strict';

const {
  AGENT_SPEC_VERSION,
  TASK_SPEC_VERSION,
  isParsableAgent,
  normalizeAgentSpec,
  normalizeTaskSpec,
} = require('../../../.aios-core/infrastructure/scripts/skills-sync/contracts');

describe('skills-sync contracts', () => {
  it('normalizes AgentSpec from parsed agent data', () => {
    const spec = normalizeAgentSpec({
      id: 'dev',
      filename: 'dev/dev.md',
      agent: {
        name: 'Dex',
        title: 'Developer',
        icon: '*',
        whenToUse: 'Build and refactor code.',
      },
      persona_profile: { archetype: 'Builder' },
      commands: [
        { name: 'help', description: 'Show commands', visibility: ['quick', 'key', 'full'] },
        { run: 'Execute' },
      ],
      dependencies: { tasks: ['dev-develop-story.md'] },
    });

    expect(spec.specVersion).toBe(AGENT_SPEC_VERSION);
    expect(spec.id).toBe('dev');
    expect(spec.sourcePath).toBe('.aios-core/development/agents/dev/dev.md');
    expect(spec.metadata.title).toBe('Developer');
    expect(spec.metadata.archetype).toBe('Builder');
    expect(spec.commands.length).toBe(2);
    expect(spec.commands[0].name).toBe('help');
    expect(spec.dependencies.tasks).toContain('dev-develop-story.md');
  });

  it('handles parsable and non-parsable agent states', () => {
    expect(isParsableAgent({ error: null })).toBe(true);
    expect(isParsableAgent({ error: 'YAML parse failed, using fallback extraction' })).toBe(true);
    expect(isParsableAgent({ error: 'Failed to parse YAML' })).toBe(false);
  });

  it('normalizes TaskSpec from parsed task data', () => {
    const spec = normalizeTaskSpec({
      id: 'qa-run-tests',
      filename: 'qa-run-tests.md',
      title: 'Run Tests',
      summary: 'Run validation pipeline.',
      frontmatter: { name: 'run-tests' },
      taskDefinition: { task: 'qaRunTests()' },
      elicit: true,
    });

    expect(spec.specVersion).toBe(TASK_SPEC_VERSION);
    expect(spec.id).toBe('qa-run-tests');
    expect(spec.sourcePath).toBe('.aios-core/development/tasks/qa-run-tests.md');
    expect(spec.title).toBe('Run Tests');
    expect(spec.taskDefinition.task).toBe('qaRunTests()');
    expect(spec.elicit).toBe(true);
  });
});
