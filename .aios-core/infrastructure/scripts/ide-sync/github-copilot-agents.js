'use strict';

const yaml = require('js-yaml');
const { normalizeCommands, getVisibleCommands } = require('./agent-parser');

function trimText(text, max = 220) {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 3).trim()}...`;
}

function uniqueCommands(commands) {
  const seen = new Set();
  const result = [];

  for (const command of commands) {
    const name = String(command?.name || '').trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    result.push(command);
  }

  return result;
}

function buildStarterCommands(agentData) {
  const commands = normalizeCommands(agentData.commands || []);
  const quick = getVisibleCommands(commands, 'quick');
  const key = getVisibleCommands(commands, 'key');
  const selected = uniqueCommands([...quick, ...key]).slice(0, 8);

  if (selected.length === 0) {
    return '- `*help` - Show available commands';
  }

  return selected
    .map((command) => `- \`*${command.name}\` - ${command.description || 'No description'}`)
    .join('\n');
}

function buildFrontmatter(agentData) {
  const agent = agentData.agent || {};
  const title = agent.title || 'AIOS Agent';
  const description = trimText(
    agent.whenToUse || `Use @${agentData.id} for specialized AIOS workflows.`,
    240,
  );

  return {
    name: `aios-${agentData.id}`,
    description: `${title}. ${description}`,
    target: 'github-copilot',
  };
}

function renderFrontmatter(data) {
  const body = yaml.dump(data, { lineWidth: 1000, noRefs: true }).trimEnd();
  return `---\n${body}\n---`;
}

function transform(agentData) {
  const agent = agentData.agent || {};
  const name = agent.name || agentData.id;
  const title = agent.title || 'AIOS Agent';
  const whenToUse = trimText(
    agent.whenToUse || `Use @${agentData.id} for specialized AIOS workflows.`,
    320,
  );
  const starterCommands = buildStarterCommands(agentData);
  const sourcePath = `.aios-core/development/agents/${agentData.filename}`;

  return `${renderFrontmatter(buildFrontmatter(agentData))}

# AIOS ${title} (${name})

## Source of Truth
- Load \`${sourcePath}\`.
- Follow the persona, command system, and dependency rules defined there.

## Operational Guidance
- Start by understanding the requested outcome and matching it to the source agent commands.
- Preserve constitutional constraints and quality gates from the canonical agent.
- Keep responses concise and execution-focused.

## Starter Commands
${starterCommands}

## When To Use
${whenToUse}
`;
}

function getFilename(agentData) {
  return `${agentData.id}.agent.md`;
}

module.exports = {
  transform,
  getFilename,
  format: 'github-copilot-native-agent',
};
