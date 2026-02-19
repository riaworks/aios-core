'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { normalizeCommands, getVisibleCommands } = require('./agent-parser');
const { getAgentSkillId } = require('../skills-sync/renderers/agent-skill');

/**
 * All agents use external agent-context.md file strategy.
 * (Migrated from AB-test: Group A won on qualitative analysis.)
 */
const GROUP_A_AGENTS = new Set([
  'dev', 'devops', 'qa', 'pm', 'architect', 'data-engineer',
  'po', 'sm', 'analyst', 'ux-design-expert', 'aios-master', 'squad-creator',
]);

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

function getNativeAgentName(agentData) {
  const id = String(agentData?.id || '').trim();
  if (!id) return 'aios-agent';
  return id;
}

function buildFrontmatter(agentData) {
  const agent = agentData.agent || {};
  const description = trimText(
    agent.whenToUse || `Use @${agentData.id} for specialized AIOS workflows.`,
    240,
  );

  return {
    name: getNativeAgentName(agentData),
    description,
    memory: 'project',
    model: 'sonnet',
    skills: [getAgentSkillId(agentData.id), 'project-context'],
  };
}

function renderFrontmatter(data) {
  const body = yaml.dump(data, { lineWidth: 1000, noRefs: true }).trimEnd();
  return `---\n${body}\n---`;
}

/**
 * Read SYNAPSE agent domain file content.
 * Returns parsed authority + rules sections, or null if not found.
 */
function readSynapseAgent(agentId) {
  const projectRoot = process.cwd();

  // Map agent IDs to synapse file names
  const synapseMap = {
    'ux-design-expert': 'agent-ux',
  };
  const synapseFilename = synapseMap[agentId] || `agent-${agentId}`;
  const synapsePath = path.join(projectRoot, '.synapse', synapseFilename);

  try {
    const content = fs.readFileSync(synapsePath, 'utf8');
    const lines = content.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith('#'));

    const authority = [];
    const rules = [];

    for (const line of lines) {
      const match = line.match(/^AGENT_\w+_(AUTH|RULE)_\d+=(.+)$/);
      if (!match) continue;
      const [, type, value] = match;
      if (type === 'AUTH') authority.push(value.trim());
      if (type === 'RULE') rules.push(value.trim());
    }

    return { authority, rules };
  } catch {
    return null;
  }
}

/**
 * Get per-agent core-config subset (human-readable).
 * Maps agent IDs to their relevant config keys.
 */
function getAgentConfig(agentId) {
  const projectRoot = process.cwd();
  const configPath = path.join(projectRoot, '.aios-core', 'core-config.yaml');

  let config;
  try {
    config = yaml.load(fs.readFileSync(configPath, 'utf8'));
  } catch {
    return null;
  }

  const configMap = {
    po: [
      `Story location: ${config.devStoryLocation || 'docs/stories'}`,
      `Story backlog: ${config.storyBacklog?.location || 'docs/stories/backlog'}`,
      `Epic file pattern: ${config.prd?.epicFilePattern || 'epic-{n}*.md'}`,
    ],
    sm: [
      `Story location: ${config.devStoryLocation || 'docs/stories'}`,
      `Story backlog: ${config.storyBacklog?.location || 'docs/stories/backlog'}`,
      `PRD: ${config.prd?.prdFile || 'docs/prd.md'}`,
    ],
    analyst: [
      `Architecture docs: ${config.architecture?.architectureShardedLocation || 'docs/architecture'}`,
      `PRD: ${config.prd?.prdFile || 'docs/prd.md'}`,
      `Decision logging: ${config.decisionLogging?.enabled ? 'enabled' : 'disabled'}, format=${config.decisionLogging?.format || 'adr'}`,
    ],
    'ux-design-expert': [
      `Story location: ${config.devStoryLocation || 'docs/stories'}`,
      `Architecture docs: ${config.architecture?.architectureShardedLocation || 'docs/architecture'}`,
    ],
    'aios-master': [
      `Project type: ${config.project?.type || 'EXISTING_AIOS'} (v${config.project?.version || '2.1.0'})`,
      `IDE sync targets: ${Object.keys(config.ideSync?.targets || {}).join(', ')}`,
      `Scripts: core=${config.scriptsLocation?.core || '.aios-core/core'}, dev=${config.scriptsLocation?.development || '.aios-core/development/scripts'}`,
    ],
    'squad-creator': [
      `Squads template: ${config.squadsTemplateLocation || 'templates/squad'}`,
      `Squads auto-load: ${config.squads?.autoLoad || false}`,
    ],
  };

  const lines = configMap[agentId] || [];

  // Per-agent always-load files
  const alwaysLoad = config.agentAlwaysLoadFiles?.[agentId] || [];
  if (alwaysLoad.length > 0) {
    lines.push('Always-load files:');
    for (const f of alwaysLoad) {
      lines.push(`  - ${f}`);
    }
  }

  return lines.length > 0 ? lines : null;
}

/**
 * Build Activation Flow — all agents use external agent-context.md file.
 */
function buildActivationFlowA(agentData) {
  const sourcePath = `.aios-core/development/agents/${agentData.filename}`;
  const agentDir = path.dirname(sourcePath);

  return `## Activation Flow
1. Read the COMPLETE source agent definition: \`${sourcePath}\`
2. Read your memory file: \`${agentDir}/MEMORY.md\`
3. Read your agent context (authority, rules, config): \`${agentDir}/agent-context.md\`
4. Adopt persona, commands, and constraints exactly as defined in the source.
5. Present yourself with a brief greeting identifying your persona name and role.
6. Stay in this persona until explicit exit.`;
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
  const isGroupA = GROUP_A_AGENTS.has(agentData.id);

  // Common header
  const header = `${renderFrontmatter(buildFrontmatter(agentData))}

# AIOS ${title} (${name})

## Purpose
${whenToUse}

## Source of Truth
- Load \`${sourcePath}\` and follow it as canonical definition.
- Keep behavior and dependency usage aligned with the source file.`;

  let activationFlow;

  if (isGroupA) {
    activationFlow = buildActivationFlowA(agentData);
  } else {
    // Unknown agent — fallback to basic activation (no context file)
    activationFlow = `## Activation Flow
1. Read the full source agent definition before acting.
2. Adopt persona, commands, and constraints exactly as defined.
3. Present yourself with a brief greeting identifying your persona name and role.
4. Stay in this persona until explicit exit.`;
  }

  return `${header}

${activationFlow}

## Starter Commands
${starterCommands}
`;
}

function getFilename(agentData) {
  return path.basename(agentData.filename);
}

module.exports = {
  getNativeAgentName,
  GROUP_A_AGENTS,
  transform,
  getFilename,
  format: 'claude-native-agent',
};
