'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  parseTaskFile,
  parseAllTasks,
  extractSummary,
  extractCommandHint,
} = require('../../../.aios-core/infrastructure/scripts/ide-sync/task-parser');

describe('task-parser', () => {
  let tmpRoot;

  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'aios-task-parser-'));
  });

  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it('parses frontmatter, title, summary, task yaml and elicit=true', () => {
    const filePath = path.join(tmpRoot, 'sample-task.md');
    fs.writeFileSync(
      filePath,
      [
        '---',
        'name: sample-task',
        'elicit: true',
        '---',
        '',
        '# Sample Task',
        '',
        'This task validates parser behavior.',
        '',
        '```yaml',
        'task: sampleTask()',
        'elicit: true',
        '```',
        '',
      ].join('\n'),
      'utf8',
    );

    const parsed = parseTaskFile(filePath);
    expect(parsed.error).toBe(null);
    expect(parsed.id).toBe('sample-task');
    expect(parsed.title).toBe('Sample Task');
    expect(parsed.summary).toBe('This task validates parser behavior.');
    expect(parsed.frontmatter.name).toBe('sample-task');
    expect(parsed.taskDefinition.task).toBe('sampleTask()');
    expect(parsed.elicit).toBe(true);
  });

  it('falls back to filename title when markdown heading is missing', () => {
    const filePath = path.join(tmpRoot, 'no-heading.md');
    fs.writeFileSync(filePath, 'Plain text without heading.', 'utf8');

    const parsed = parseTaskFile(filePath);
    expect(parsed.title).toBe('no-heading');
    expect(parsed.summary).toBe('Plain text without heading.');
    expect(parsed.elicit).toBe(false);
  });

  it('parses all markdown tasks from directory', () => {
    fs.writeFileSync(path.join(tmpRoot, 'b.md'), '# B\n\nSummary B', 'utf8');
    fs.writeFileSync(path.join(tmpRoot, 'a.md'), '# A\n\nSummary A', 'utf8');
    fs.writeFileSync(path.join(tmpRoot, 'ignore.txt'), 'noop', 'utf8');

    const tasks = parseAllTasks(tmpRoot);
    const ids = tasks.map((task) => task.id);

    expect(tasks).toHaveLength(2);
    expect(ids).toEqual(['a', 'b']);
  });

  it('prefers Purpose section text over command metadata for summary', () => {
    const filePath = path.join(tmpRoot, 'purpose-priority.md');
    fs.writeFileSync(
      filePath,
      [
        '# Task: Build Resume',
        '',
        '> **Command:** `*build-resume {story-id}`',
        '> **Agent:** @dev',
        '',
        '## Purpose',
        '',
        'Resume an autonomous build from its last checkpoint after failure.',
      ].join('\n'),
      'utf8',
    );

    const parsed = parseTaskFile(filePath);
    expect(parsed.summary).toBe('Resume an autonomous build from its last checkpoint after failure.');
  });

  it('extracts command hint from markdown command metadata', () => {
    const body = [
      '# Task: Build',
      '',
      '> **Command:** `*build {story-id}`',
      '',
      '## Purpose',
      '',
      'Build implementation for a story.',
    ].join('\n');

    expect(extractCommandHint(body)).toBe('*build {story-id}');
  });

  it('cleans markdown formatting when extracting summary', () => {
    const body = [
      '# Task',
      '',
      '**Purpose:** Validate prerequisites BEFORE task execution (blocking)',
    ].join('\n');

    expect(extractSummary(body)).toBe('Validate prerequisites BEFORE task execution (blocking)');
  });
});
