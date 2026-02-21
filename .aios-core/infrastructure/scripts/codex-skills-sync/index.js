#!/usr/bin/env node
'use strict';

const path = require('path');
const os = require('os');

const { parseAllAgents } = require('../ide-sync/agent-parser');
const { normalizeAgentSpec } = require('../skills-sync/contracts');
const {
  buildAgentSpecsFromParsedAgents,
  buildAgentSkillPlan,
  writeSkillPlan,
} = require('../skills-sync');
const {
  buildAgentSkillContent,
  getAgentSkillId,
} = require('../skills-sync/renderers/agent-skill');

function getCodexHome() {
  return process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
}

function getDefaultOptions() {
  const projectRoot = process.cwd();
  const envLocalDir = process.env.AIOS_CODEX_LOCAL_SKILLS_DIR;
  const envGlobalDir = process.env.AIOS_CODEX_GLOBAL_SKILLS_DIR;
  return {
    projectRoot,
    sourceDir: path.join(projectRoot, '.aios-core', 'development', 'agents'),
    localSkillsDir: envLocalDir || path.join(projectRoot, '.codex', 'skills'),
    globalSkillsDir: envGlobalDir || path.join(getCodexHome(), 'skills'),
    global: false,
    globalOnly: false,
    dryRun: false,
    quiet: false,
  };
}

function getSkillId(agentId) {
  return getAgentSkillId(agentId);
}

function buildSkillContent(agentData) {
  return buildAgentSkillContent(normalizeAgentSpec(agentData));
}

function buildSkillPlan(agents, skillsDir) {
  const specs = buildAgentSpecsFromParsedAgents(agents);
  const plan = buildAgentSkillPlan(specs, skillsDir);

  return plan.map((item) => ({
    agentId: item.sourceId,
    skillId: item.skillId,
    targetDir: item.targetDir,
    targetFile: item.targetFile,
    content: item.content,
  }));
}

function syncSkills(options = {}) {
  const resolved = { ...getDefaultOptions(), ...options };
  if (resolved.globalOnly) {
    resolved.global = true;
  }

  const agents = parseAllAgents(resolved.sourceDir);
  const plan = buildSkillPlan(agents, resolved.localSkillsDir);

  if (!resolved.globalOnly) {
    writeSkillPlan(plan, resolved);
  }

  if (resolved.global) {
    const globalPlan = buildSkillPlan(agents, resolved.globalSkillsDir);
    writeSkillPlan(globalPlan, resolved);
  }

  return {
    generated: plan.length,
    localSkillsDir: resolved.localSkillsDir,
    globalSkillsDir: resolved.global || resolved.globalOnly ? resolved.globalSkillsDir : null,
    dryRun: resolved.dryRun,
  };
}

function parseArgs(argv = process.argv.slice(2)) {
  const args = new Set(argv);
  return {
    global: args.has('--global'),
    globalOnly: args.has('--global-only'),
    dryRun: args.has('--dry-run'),
    quiet: args.has('--quiet') || args.has('-q'),
  };
}

function main() {
  const options = parseArgs();
  const result = syncSkills(options);

  if (!options.quiet) {
    if (!options.globalOnly) {
      console.log(`✅ Generated ${result.generated} Codex skills in ${result.localSkillsDir}`);
    }
    if (result.globalSkillsDir) {
      console.log(`✅ Installed ${result.generated} Codex skills in ${result.globalSkillsDir}`);
    }
    if (result.dryRun) {
      console.log('ℹ️ Dry-run mode: no files written');
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  buildSkillContent,
  buildSkillPlan,
  syncSkills,
  parseArgs,
  getCodexHome,
  getSkillId,
};
