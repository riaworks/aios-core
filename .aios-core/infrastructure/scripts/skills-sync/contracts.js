'use strict';

const { normalizeCommands } = require('../ide-sync/agent-parser');

const AGENT_SPEC_VERSION = 1;
const TASK_SPEC_VERSION = 1;

function normalizeText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function isParsableAgent(agentData) {
  return !agentData.error || agentData.error === 'YAML parse failed, using fallback extraction';
}

function normalizeVisibility(visibility) {
  if (!Array.isArray(visibility) || visibility.length === 0) {
    return ['full', 'quick'];
  }
  return visibility;
}

function normalizeAgentSpec(agentData = {}) {
  const agent = agentData.agent || {};
  const persona = agentData.persona_profile || {};
  const commands = normalizeCommands(agentData.commands || []).map((command) => ({
    name: String(command.name || '').trim(),
    description: command.description || 'No description',
    visibility: normalizeVisibility(command.visibility),
  }));

  const id = String(agentData.id || '').trim();
  const filename = String(agentData.filename || `${id}/${id}.md`).trim();

  return {
    specVersion: AGENT_SPEC_VERSION,
    id,
    filename,
    sourcePath: `.aios-core/development/agents/${filename}`,
    metadata: {
      name: agent.name || id,
      title: agent.title || 'AIOS Agent',
      icon: agent.icon || '🤖',
      whenToUse: normalizeText(agent.whenToUse || `Use @${id} for specialized tasks.`),
      archetype: persona.archetype || '',
    },
    commands,
    dependencies: agentData.dependencies || {},
    sections: agentData.sections || {},
  };
}

function normalizeTaskSpec(taskData = {}) {
  const id = String(taskData.id || '').trim();
  const filename = String(taskData.filename || `${id}.md`).trim();
  const normalizedTitle = normalizeText(taskData.title || id);
  const normalizedSummary = normalizeText(
    taskData.summary || `Task workflow for ${normalizedTitle}.`,
  );

  return {
    specVersion: TASK_SPEC_VERSION,
    id,
    filename,
    sourcePath: `.aios-core/development/tasks/${filename}`,
    title: normalizedTitle,
    summary: normalizedSummary,
    command: normalizeText(taskData.command || ''),
    frontmatter: taskData.frontmatter || {},
    taskDefinition: taskData.taskDefinition || null,
    elicit: Boolean(taskData.elicit),
  };
}

module.exports = {
  AGENT_SPEC_VERSION,
  TASK_SPEC_VERSION,
  isParsableAgent,
  normalizeAgentSpec,
  normalizeTaskSpec,
  normalizeText,
};
