'use strict';

const fs = require('fs-extra');
const path = require('path');

const {
  isParsableAgent,
  normalizeAgentSpec,
  normalizeTaskSpec,
} = require('./contracts');
const { getAgentSkillId, buildAgentSkillContent } = require('./renderers/agent-skill');
const { getTaskSkillId, buildTaskSkillContent } = require('./renderers/task-skill');

function compareById(left, right) {
  return String(left?.id || '').localeCompare(String(right?.id || ''));
}

function compareBySkillId(left, right) {
  return String(left?.skillId || '').localeCompare(String(right?.skillId || ''));
}

function buildAgentSpecsFromParsedAgents(parsedAgents) {
  return (parsedAgents || [])
    .filter(isParsableAgent)
    .map(normalizeAgentSpec)
    .sort(compareById);
}

function buildTaskSpecsFromParsedTasks(parsedTasks) {
  return (parsedTasks || [])
    .filter((task) => !task.error)
    .map(normalizeTaskSpec)
    .sort(compareById);
}

function buildAgentSkillPlan(agentSpecs, skillsDir) {
  return (agentSpecs || [])
    .map((agentSpec) => {
      const skillId = getAgentSkillId(agentSpec.id);
      const targetDir = path.join(skillsDir, skillId);
      return {
        type: 'agent',
        sourceId: agentSpec.id,
        skillId,
        targetDir,
        targetFile: path.join(targetDir, 'SKILL.md'),
        content: buildAgentSkillContent(agentSpec),
      };
    })
    .sort(compareBySkillId);
}

function buildTaskSkillPlan(taskSpecs, skillsDir, contentBuilder) {
  const builder = contentBuilder || buildTaskSkillContent;
  return (taskSpecs || [])
    .map((taskSpec) => {
      const skillId = getTaskSkillId(taskSpec.id, taskSpec.agent);
      const targetDir = path.join(skillsDir, skillId);
      return {
        type: 'task',
        sourceId: taskSpec.id,
        skillId,
        targetDir,
        targetFile: path.join(targetDir, 'SKILL.md'),
        content: builder(taskSpec),
      };
    })
    .sort(compareBySkillId);
}

function writeSkillPlan(plan, options = {}) {
  const resolved = {
    dryRun: false,
    ...options,
  };

  for (const item of plan || []) {
    if (resolved.dryRun) continue;

    try {
      fs.ensureDirSync(item.targetDir);
      fs.writeFileSync(item.targetFile, item.content, 'utf8');
    } catch (error) {
      throw new Error(`Failed to write skill ${item.skillId} at ${item.targetFile}: ${error.message}`);
    }
  }
}

module.exports = {
  buildAgentSpecsFromParsedAgents,
  buildTaskSpecsFromParsedTasks,
  buildAgentSkillPlan,
  buildTaskSkillPlan,
  writeSkillPlan,
};
