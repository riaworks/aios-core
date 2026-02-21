/**
 * Tests for AGF-5 hooks: user-prompt-submit.sh and stop-quality-gate.sh
 * @story AGF-5 -- SYNAPSE-Lite: UserPromptSubmit Hook + XML Injection + Bracket Inversion
 */

'use strict';

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const HOOKS_DIR = path.join(PROJECT_ROOT, '.claude', 'hooks');
const RULES_DIR = path.join(PROJECT_ROOT, '.claude', 'rules');
const USER_PROMPT_HOOK = path.join(HOOKS_DIR, 'user-prompt-submit.sh');
const STOP_HOOK = path.join(HOOKS_DIR, 'stop-quality-gate.sh');
const SETTINGS_JSON = path.join(PROJECT_ROOT, '.claude', 'settings.json');

// Helper: run a hook with stdin input, returns { stdout, stderr, status }
function runHook(hookPath, stdinInput, env = {}) {
  const result = spawnSync('bash', [hookPath], {
    input: stdinInput,
    encoding: 'utf8',
    env: { ...process.env, ...env },
    timeout: 10000,
  });
  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    status: result.status,
  };
}

describe('AGF-5: SYNAPSE-Lite Hooks', () => {
  // -------------------------------------------------------------------
  // File existence
  // -------------------------------------------------------------------
  describe('Hook file existence', () => {
    it('user-prompt-submit.sh should exist', () => {
      expect(fs.existsSync(USER_PROMPT_HOOK)).toBe(true);
    });

    it('stop-quality-gate.sh should exist', () => {
      expect(fs.existsSync(STOP_HOOK)).toBe(true);
    });
  });

  // -------------------------------------------------------------------
  // settings.json hook registration
  // -------------------------------------------------------------------
  describe('settings.json hook registration', () => {
    let settings;

    beforeAll(() => {
      settings = JSON.parse(fs.readFileSync(SETTINGS_JSON, 'utf8'));
    });

    it('should register UserPromptSubmit hook', () => {
      expect(settings.hooks).toHaveProperty('UserPromptSubmit');
      const ups = settings.hooks.UserPromptSubmit;
      expect(Array.isArray(ups)).toBe(true);
      const hookCommands = ups[0].hooks.map((h) => h.command);
      expect(hookCommands.some((c) => c.includes('user-prompt-submit.sh'))).toBe(true);
    });

    it('UserPromptSubmit hook should have timeout <= 5s', () => {
      const ups = settings.hooks.UserPromptSubmit;
      const timeout = ups[0].hooks[0].timeout;
      expect(timeout).toBeLessThanOrEqual(5);
    });

    it('should register Stop hook', () => {
      expect(settings.hooks).toHaveProperty('Stop');
      const stop = settings.hooks.Stop;
      expect(Array.isArray(stop)).toBe(true);
      const hookCommands = stop[0].hooks.map((h) => h.command);
      expect(hookCommands.some((c) => c.includes('stop-quality-gate.sh'))).toBe(true);
    });

    it('should still have SessionStart and PreCompact hooks', () => {
      expect(settings.hooks).toHaveProperty('SessionStart');
      expect(settings.hooks).toHaveProperty('PreCompact');
    });
  });

  // -------------------------------------------------------------------
  // UserPromptSubmit hook -- output format
  // -------------------------------------------------------------------
  describe('UserPromptSubmit hook -- output format', () => {
    let tmpDir;
    let envFile;
    let agentFile;
    let hookEnv;

    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agf5-ups-'));
      const agentMemDir = path.join(tmpDir, '.claude', 'agent-memory');
      fs.mkdirSync(agentMemDir, { recursive: true });
      envFile = path.join(agentMemDir, '.env');
      agentFile = path.join(agentMemDir, '.active-agent');
      fs.writeFileSync(envFile, 'AIOS_BRANCH=pedro-aios\nAIOS_PROMPT_COUNT=0\n');
      fs.writeFileSync(agentFile, 'dev');
      hookEnv = { CLAUDE_PROJECT_DIR: tmpDir };
    });

    afterEach(() => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('should exit 0 on valid input', () => {
      const result = runHook(USER_PROMPT_HOOK, '{"prompt":"hello world"}', hookEnv);
      expect(result.status).toBe(0);
    });

    it('should output valid JSON', () => {
      const result = runHook(USER_PROMPT_HOOK, '{"prompt":"hello world"}', hookEnv);
      expect(() => JSON.parse(result.stdout)).not.toThrow();
    });

    it('should output hookSpecificOutput with hookEventName UserPromptSubmit', () => {
      const result = runHook(USER_PROMPT_HOOK, '{"prompt":"hello world"}', hookEnv);
      const parsed = JSON.parse(result.stdout);
      expect(parsed).toHaveProperty('hookSpecificOutput');
      expect(parsed.hookSpecificOutput).toHaveProperty('hookEventName', 'UserPromptSubmit');
      expect(parsed.hookSpecificOutput).toHaveProperty('additionalContext');
    });

    it('should always include session-state in XML output', () => {
      const result = runHook(USER_PROMPT_HOOK, '{"prompt":"hello world"}', hookEnv);
      const parsed = JSON.parse(result.stdout);
      const xml = parsed.hookSpecificOutput.additionalContext;
      expect(xml).toContain('<session-state');
      expect(xml).toContain('priority="high"');
    });

    it('should increment prompt_count in .env file', () => {
      runHook(USER_PROMPT_HOOK, '{"prompt":"hello"}', hookEnv);
      const envContent = fs.readFileSync(envFile, 'utf8');
      expect(envContent).toContain('AIOS_PROMPT_COUNT=1');
    });

    it('should reflect branch from .env in session-state', () => {
      const result = runHook(USER_PROMPT_HOOK, '{"prompt":"hello"}', hookEnv);
      const parsed = JSON.parse(result.stdout);
      const xml = parsed.hookSpecificOutput.additionalContext;
      expect(xml).toContain('pedro-aios');
    });

    it('should output FRESH bracket when prompt_count < 10', () => {
      const result = runHook(USER_PROMPT_HOOK, '{"prompt":"hello"}', hookEnv);
      const parsed = JSON.parse(result.stdout);
      const xml = parsed.hookSpecificOutput.additionalContext;
      expect(xml).toContain('FRESH');
    });

    it('should NOT include context-bracket XML when bracket is FRESH', () => {
      const result = runHook(USER_PROMPT_HOOK, '{"prompt":"hello"}', hookEnv);
      const parsed = JSON.parse(result.stdout);
      const xml = parsed.hookSpecificOutput.additionalContext;
      expect(xml).not.toContain('<context-bracket');
    });

    it('should output MODERATE bracket when prompt_count is 10-24', () => {
      fs.writeFileSync(envFile, 'AIOS_BRANCH=pedro-aios\nAIOS_PROMPT_COUNT=12\n');
      const result = runHook(USER_PROMPT_HOOK, '{"prompt":"hello"}', hookEnv);
      const parsed = JSON.parse(result.stdout);
      const xml = parsed.hookSpecificOutput.additionalContext;
      expect(xml).toContain('MODERATE');
      expect(xml).toContain('<context-bracket');
    });

    it('should output DEPLETED bracket when prompt_count is 25-39', () => {
      fs.writeFileSync(envFile, 'AIOS_BRANCH=pedro-aios\nAIOS_PROMPT_COUNT=30\n');
      const result = runHook(USER_PROMPT_HOOK, '{"prompt":"hello"}', hookEnv);
      const parsed = JSON.parse(result.stdout);
      const xml = parsed.hookSpecificOutput.additionalContext;
      expect(xml).toContain('DEPLETED');
    });

    it('should output CRITICAL bracket when prompt_count >= 40', () => {
      fs.writeFileSync(envFile, 'AIOS_BRANCH=pedro-aios\nAIOS_PROMPT_COUNT=40\n');
      const result = runHook(USER_PROMPT_HOOK, '{"prompt":"hello"}', hookEnv);
      const parsed = JSON.parse(result.stdout);
      const xml = parsed.hookSpecificOutput.additionalContext;
      expect(xml).toContain('CRITICAL');
      expect(xml).toContain('handoff');
    });
  });

  // -------------------------------------------------------------------
  // UserPromptSubmit hook -- agent switch detection (D6)
  // -------------------------------------------------------------------
  describe('UserPromptSubmit hook -- agent switch detection', () => {
    let tmpDir;
    let agentFile;
    let hookEnv;

    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agf5-switch-'));
      const agentMemDir = path.join(tmpDir, '.claude', 'agent-memory');
      const agentsDir = path.join(tmpDir, '.claude', 'agents');
      fs.mkdirSync(agentMemDir, { recursive: true });
      fs.mkdirSync(agentsDir, { recursive: true });
      agentFile = path.join(agentMemDir, '.active-agent');
      const envFile = path.join(agentMemDir, '.env');
      fs.writeFileSync(envFile, 'AIOS_BRANCH=test\nAIOS_PROMPT_COUNT=0\n');
      fs.writeFileSync(agentFile, 'dev');
      // Create a fake qa agent file
      fs.writeFileSync(path.join(agentsDir, 'qa.md'), '# QA Agent\n## === PERSONA DNA ===\nQuinn the QA specialist.\n## === ENHANCEMENT ===\n');
      hookEnv = { CLAUDE_PROJECT_DIR: tmpDir };
    });

    afterEach(() => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('should detect @qa at start of prompt and switch agent', () => {
      runHook(USER_PROMPT_HOOK, '{"prompt":"@qa review this code"}', hookEnv);
      const newAgent = fs.readFileSync(agentFile, 'utf8').trim();
      expect(newAgent).toBe('qa');
    });

    it('should NOT switch agent for @mention mid-prompt (email-like)', () => {
      runHook(USER_PROMPT_HOOK, '{"prompt":"send to user@example.com"}', hookEnv);
      const activeAgent = fs.readFileSync(agentFile, 'utf8').trim();
      expect(activeAgent).toBe('dev'); // unchanged
    });

    it('should NOT switch for non-existent agent', () => {
      runHook(USER_PROMPT_HOOK, '{"prompt":"@nonexistent do something"}', hookEnv);
      const activeAgent = fs.readFileSync(agentFile, 'utf8').trim();
      expect(activeAgent).toBe('dev'); // unchanged
    });

    it('should include switch info in XML when agent switches', () => {
      const result = runHook(USER_PROMPT_HOOK, '{"prompt":"@qa review this"}', hookEnv);
      const parsed = JSON.parse(result.stdout);
      const xml = parsed.hookSpecificOutput.additionalContext;
      expect(xml).toContain('qa');
    });
  });

  // -------------------------------------------------------------------
  // UserPromptSubmit hook -- keyword RECALL (AC3)
  // -------------------------------------------------------------------
  describe('UserPromptSubmit hook -- keyword RECALL', () => {
    let tmpDir;
    let hookEnv;

    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agf5-kw-'));
      const agentMemDir = path.join(tmpDir, '.claude', 'agent-memory');
      const rulesDir = path.join(tmpDir, '.claude', 'rules');
      fs.mkdirSync(agentMemDir, { recursive: true });
      fs.mkdirSync(rulesDir, { recursive: true });
      fs.writeFileSync(path.join(agentMemDir, '.env'), 'AIOS_BRANCH=test\nAIOS_PROMPT_COUNT=0\n');
      fs.writeFileSync(path.join(agentMemDir, '.active-agent'), 'none');
      // Create a test keyword rule
      fs.writeFileSync(
        path.join(rulesDir, 'keyword-testdb.md'),
        '---\ntrigger: testdb\n---\n# TestDB Rules\n- Always use transactions\n'
      );
      hookEnv = { CLAUDE_PROJECT_DIR: tmpDir };
    });

    afterEach(() => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('should inject keyword-rules when keyword matches', () => {
      const result = runHook(USER_PROMPT_HOOK, '{"prompt":"how do I use testdb here?"}', hookEnv);
      const parsed = JSON.parse(result.stdout);
      const xml = parsed.hookSpecificOutput.additionalContext;
      expect(xml).toContain('<keyword-rules');
      expect(xml).toContain('testdb');
    });

    it('should NOT inject keyword-rules when no keyword matches', () => {
      const result = runHook(USER_PROMPT_HOOK, '{"prompt":"just a regular prompt"}', hookEnv);
      const parsed = JSON.parse(result.stdout);
      const xml = parsed.hookSpecificOutput.additionalContext;
      expect(xml).not.toContain('<keyword-rules');
    });

    it('should have zero overhead (no keyword-rules tag) when no match', () => {
      const result = runHook(USER_PROMPT_HOOK, '{"prompt":"tell me about the weather"}', hookEnv);
      const parsed = JSON.parse(result.stdout);
      const xml = parsed.hookSpecificOutput.additionalContext;
      expect(xml).not.toContain('keyword-rules');
    });
  });

  // -------------------------------------------------------------------
  // Keyword rules files existence
  // -------------------------------------------------------------------
  describe('Keyword rules files existence (AC3)', () => {
    it('keyword-supabase.md should exist with trigger frontmatter', () => {
      const filePath = path.join(RULES_DIR, 'keyword-supabase.md');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('trigger: supabase');
    });

    it('keyword-migration.md should exist with trigger frontmatter', () => {
      const filePath = path.join(RULES_DIR, 'keyword-migration.md');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('trigger: migration');
    });

    it('keyword-deploy.md should exist with trigger frontmatter', () => {
      const filePath = path.join(RULES_DIR, 'keyword-deploy.md');
      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('trigger: deploy');
    });
  });

  // -------------------------------------------------------------------
  // Stop hook
  // -------------------------------------------------------------------
  describe('Stop hook', () => {
    it('should output {} immediately when stop_hook_active is true (infinite loop guard)', () => {
      const result = runHook(STOP_HOOK, '{"stop_hook_active":true,"last_assistant_message":"done"}');
      expect(result.status).toBe(0);
      const parsed = JSON.parse(result.stdout);
      expect(parsed).toEqual({});
    });

    it('should exit 0 on valid input', () => {
      const result = runHook(STOP_HOOK, '{"stop_hook_active":false,"last_assistant_message":"done"}');
      expect(result.status).toBe(0);
    });

    it('should output valid JSON when stop_hook_active is false', () => {
      const result = runHook(STOP_HOOK, '{"stop_hook_active":false}');
      expect(() => JSON.parse(result.stdout)).not.toThrow();
    });

    it('should output {} (accept stop) when no code changes', () => {
      // Run from a temp dir with no git changes
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agf5-stop-'));
      const agentMemDir = path.join(tmpDir, '.claude', 'agent-memory');
      fs.mkdirSync(agentMemDir, { recursive: true });
      fs.writeFileSync(path.join(agentMemDir, '.env'), 'AIOS_PROMPT_COUNT=5\n');
      fs.writeFileSync(path.join(agentMemDir, '.active-agent'), 'dev');

      // Init a git repo with no changes
      execSync('git init && git commit --allow-empty -m "init"', {
        cwd: tmpDir,
        stdio: 'ignore',
        env: { ...process.env, GIT_AUTHOR_NAME: 'test', GIT_AUTHOR_EMAIL: 'test@test.com',
               GIT_COMMITTER_NAME: 'test', GIT_COMMITTER_EMAIL: 'test@test.com' },
      });

      const result = runHook(STOP_HOOK, '{"stop_hook_active":false}', {
        CLAUDE_PROJECT_DIR: tmpDir,
      });
      const parsed = JSON.parse(result.stdout);
      expect(parsed).toEqual({});

      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('should write session metrics to .env on stop', () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agf5-metrics-'));
      const agentMemDir = path.join(tmpDir, '.claude', 'agent-memory');
      fs.mkdirSync(agentMemDir, { recursive: true });
      const envFile = path.join(agentMemDir, '.env');
      fs.writeFileSync(envFile, 'AIOS_PROMPT_COUNT=7\n');
      fs.writeFileSync(path.join(agentMemDir, '.active-agent'), 'dev');

      runHook(STOP_HOOK, '{"stop_hook_active":false}', {
        CLAUDE_PROJECT_DIR: tmpDir,
      });

      const envContent = fs.readFileSync(envFile, 'utf8');
      expect(envContent).toContain('AIOS_SESSION_END=');
      expect(envContent).toContain('AIOS_SESSION_PROMPTS=7');
      expect(envContent).toContain('AIOS_SESSION_AGENT=dev');

      fs.rmSync(tmpDir, { recursive: true, force: true });
    });
  });

  // -------------------------------------------------------------------
  // SYNAPSE domain migration -- rules files
  // -------------------------------------------------------------------
  describe('SYNAPSE domain migration (AC7)', () => {
    it('constitution.md should exist in .claude/rules/', () => {
      expect(fs.existsSync(path.join(RULES_DIR, 'constitution.md'))).toBe(true);
    });

    it('global-coding-standards.md should exist in .claude/rules/', () => {
      expect(fs.existsSync(path.join(RULES_DIR, 'global-coding-standards.md'))).toBe(true);
    });

    it('workflow-story-dev.md should exist in .claude/rules/', () => {
      expect(fs.existsSync(path.join(RULES_DIR, 'workflow-story-dev.md'))).toBe(true);
    });

    it('workflow-arch-review.md should exist in .claude/rules/', () => {
      expect(fs.existsSync(path.join(RULES_DIR, 'workflow-arch-review.md'))).toBe(true);
    });

    it('workflow-epic-create.md should exist in .claude/rules/', () => {
      expect(fs.existsSync(path.join(RULES_DIR, 'workflow-epic-create.md'))).toBe(true);
    });

    it('context-brackets.md should exist in .claude/rules/', () => {
      expect(fs.existsSync(path.join(RULES_DIR, 'context-brackets.md'))).toBe(true);
    });

    it('custom-rules.md should exist in .claude/rules/', () => {
      expect(fs.existsSync(path.join(RULES_DIR, 'custom-rules.md'))).toBe(true);
    });

    it('.synapse/ directory should NOT be deleted (preserved for rollback)', () => {
      const synapseDir = path.join(PROJECT_ROOT, '.synapse');
      expect(fs.existsSync(synapseDir)).toBe(true);
    });
  });
});
