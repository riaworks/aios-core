'use strict';

const fs = require('fs-extra');
const path = require('path');

const { normalizeAgentSpec, isParsableAgent } = require('../skills-sync/contracts');
const { buildAgentSkillContent, getAgentSkillId } = require('../skills-sync/renderers/agent-skill');

function trimText(text, max = 120) {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 3).trim()}...`;
}

function transform(agentData) {
  return buildAgentSkillContent(normalizeAgentSpec(agentData));
}

function getFilename(agentData) {
  return `${getAgentSkillId(agentData.id)}/SKILL.md`;
}

function buildGeminiSkillManifestEntries(agents) {
  return (agents || [])
    .filter(isParsableAgent)
    .map(normalizeAgentSpec)
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((spec) => {
      const skillId = getAgentSkillId(spec.id);
      const description = trimText(
        spec.metadata?.whenToUse || `AIOS skill for ${spec.id}.`,
        140,
      );

      return {
        name: skillId,
        path: `skills/${skillId}/SKILL.md`,
        description,
      };
    });
}

function syncGeminiSkillsManifest(agents, projectRoot, options = {}) {
  const extensionPath = path.join(projectRoot, 'packages', 'gemini-aios-extension', 'extension.json');
  const entries = buildGeminiSkillManifestEntries(agents);

  if (!fs.existsSync(extensionPath)) {
    throw new Error(`Gemini extension manifest not found: ${extensionPath}`);
  }

  const raw = fs.readFileSync(extensionPath, 'utf8');
  const parsed = JSON.parse(raw);
  parsed.skills = entries;

  if (!options.dryRun) {
    fs.writeFileSync(extensionPath, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8');
  }

  return {
    extensionPath,
    entries,
  };
}

module.exports = {
  transform,
  getFilename,
  buildGeminiSkillManifestEntries,
  syncGeminiSkillsManifest,
  format: 'gemini-agent-skill',
};
