'use strict';

const { normalizeAgentSpec } = require('../skills-sync/contracts');
const { buildAgentSkillContent, getAgentSkillId } = require('../skills-sync/renderers/agent-skill');

function transform(agentData) {
  return buildAgentSkillContent(normalizeAgentSpec(agentData));
}

function getFilename(agentData) {
  return `${getAgentSkillId(agentData.id)}/SKILL.md`;
}

module.exports = {
  transform,
  getFilename,
  format: 'claude-agent-skill',
};
