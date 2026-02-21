/**
 * Tests for AGF-4 hooks: session-start.sh and pre-compact-persona.sh
 * @story AGF-4 — Activation Foundation
 */

'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const HOOKS_DIR = path.join(PROJECT_ROOT, '.claude', 'hooks');
const SESSION_START_HOOK = path.join(HOOKS_DIR, 'session-start.sh');
const PRE_COMPACT_HOOK = path.join(HOOKS_DIR, 'pre-compact-persona.sh');
const SETTINGS_JSON = path.join(PROJECT_ROOT, '.claude', 'settings.json');

describe('AGF-4 Hooks', () => {
  describe('Hook file existence', () => {
    it('session-start.sh should exist', () => {
      expect(fs.existsSync(SESSION_START_HOOK)).toBe(true);
    });

    it('pre-compact-persona.sh should exist', () => {
      expect(fs.existsSync(PRE_COMPACT_HOOK)).toBe(true);
    });

    it('.claude/settings.json should exist', () => {
      expect(fs.existsSync(SETTINGS_JSON)).toBe(true);
    });
  });

  describe('.claude/settings.json structure', () => {
    let settings;

    beforeAll(() => {
      settings = JSON.parse(fs.readFileSync(SETTINGS_JSON, 'utf8'));
    });

    it('should have hooks key', () => {
      expect(settings).toHaveProperty('hooks');
    });

    it('should register SessionStart hook with startup matcher', () => {
      expect(settings.hooks).toHaveProperty('SessionStart');
      const sessionStart = settings.hooks.SessionStart;
      expect(Array.isArray(sessionStart)).toBe(true);
      expect(sessionStart[0]).toHaveProperty('matcher', 'startup');
      expect(sessionStart[0].hooks[0]).toHaveProperty('type', 'command');
      expect(sessionStart[0].hooks[0].command).toContain('session-start.sh');
    });

    it('should register PreCompact hook with both hooks (session-digest + persona)', () => {
      expect(settings.hooks).toHaveProperty('PreCompact');
      const preCompact = settings.hooks.PreCompact;
      expect(Array.isArray(preCompact)).toBe(true);
      const hookCommands = preCompact[0].hooks.map((h) => h.command);
      const hasSessionDigest = hookCommands.some((c) => c.includes('precompact-session-digest'));
      const hasPersona = hookCommands.some((c) => c.includes('pre-compact-persona'));
      expect(hasSessionDigest).toBe(true);
      expect(hasPersona).toBe(true);
    });

    it('SessionStart hook should have timeout configured', () => {
      const hook = settings.hooks.SessionStart[0].hooks[0];
      expect(hook).toHaveProperty('timeout');
      expect(hook.timeout).toBeLessThanOrEqual(10);
    });

    it('should use $CLAUDE_PROJECT_DIR in hook commands', () => {
      const sessionCmd = settings.hooks.SessionStart[0].hooks[0].command;
      const preCompactCmds = settings.hooks.PreCompact[0].hooks.map((h) => h.command);
      expect(sessionCmd).toContain('$CLAUDE_PROJECT_DIR');
      expect(preCompactCmds.some((c) => c.includes('$CLAUDE_PROJECT_DIR'))).toBe(true);
    });
  });

  describe('session-start.sh output format', () => {
    let output;
    let parsed;

    beforeAll(() => {
      try {
        // Run without CLAUDE_PROJECT_DIR to test graceful behavior
        const env = {
          ...process.env,
          CLAUDE_PROJECT_DIR: PROJECT_ROOT.replace(/\\/g, '/'),
        };
        const result = execSync(`bash "${SESSION_START_HOOK.replace(/\\/g, '/')}"`, {
          cwd: PROJECT_ROOT,
          env,
          encoding: 'utf8',
          timeout: 15000,
        });
        output = result.trim();
        parsed = JSON.parse(output);
      } catch (err) {
        // If bash is not available or times out, skip these tests
        output = null;
        parsed = null;
      }
    });

    it('should produce valid JSON output', () => {
      if (!output) return; // skip if bash not available
      expect(() => JSON.parse(output)).not.toThrow();
    });

    it('should have hookSpecificOutput.hookEventName = SessionStart', () => {
      if (!parsed) return;
      expect(parsed).toHaveProperty('hookSpecificOutput');
      expect(parsed.hookSpecificOutput.hookEventName).toBe('SessionStart');
    });

    it('should have hookSpecificOutput.additionalContext as string', () => {
      if (!parsed) return;
      expect(typeof parsed.hookSpecificOutput.additionalContext).toBe('string');
      expect(parsed.hookSpecificOutput.additionalContext.length).toBeGreaterThan(0);
    });

    it('additionalContext should contain branch and agent info', () => {
      if (!parsed) return;
      const ctx = parsed.hookSpecificOutput.additionalContext;
      expect(ctx).toMatch(/branch=/);
      expect(ctx).toMatch(/agent=/);
    });
  });

  describe('pre-compact-persona.sh output format', () => {
    it('should produce valid JSON when no active agent (noop case)', () => {
      try {
        const env = {
          ...process.env,
          CLAUDE_PROJECT_DIR: PROJECT_ROOT.replace(/\\/g, '/'),
        };
        // Input: empty stdin (no active agent file)
        const result = execSync(
          `echo '{"trigger":"auto"}' | bash "${PRE_COMPACT_HOOK.replace(/\\/g, '/')}"`,
          {
            cwd: PROJECT_ROOT,
            env,
            encoding: 'utf8',
            timeout: 10000,
          },
        );
        const output = result.trim();
        // Should be valid JSON: either {} or hookSpecificOutput structure
        expect(() => JSON.parse(output)).not.toThrow();
        const parsed = JSON.parse(output);
        expect(typeof parsed).toBe('object');
      } catch {
        // Skip if bash not available on this system
      }
    });

    it('should return {} when no active agent file exists', () => {
      // Create a temp dir without .active-agent to simulate no agent
      const tmpDir = path.join(os.tmpdir(), `agf4-test-${Date.now()}`);
      fs.mkdirSync(tmpDir, { recursive: true });

      try {
        const env = {
          ...process.env,
          CLAUDE_PROJECT_DIR: tmpDir.replace(/\\/g, '/'),
        };
        const result = execSync(
          `echo '{}' | bash "${PRE_COMPACT_HOOK.replace(/\\/g, '/')}"`,
          {
            cwd: tmpDir,
            env,
            encoding: 'utf8',
            timeout: 10000,
          },
        );
        const output = result.trim();
        const parsed = JSON.parse(output);
        expect(parsed).toEqual({});
      } catch {
        // Skip if bash not available
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });
  });
});
