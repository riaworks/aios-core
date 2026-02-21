'use strict';

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');

function parseYamlBlock(content) {
  try {
    return yaml.load(content);
  } catch (_) {
    return null;
  }
}

function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    return { frontmatter: null, body: content };
  }

  return {
    frontmatter: parseYamlBlock(match[1]),
    body: content.slice(match[0].length),
  };
}

function extractInlineYamlTaskDefinition(content) {
  const matches = content.match(/```yaml\s*\n([\s\S]*?)\n```/g);
  if (!matches) return null;

  for (const block of matches) {
    const innerMatch = block.match(/```yaml\s*\n([\s\S]*?)\n```/);
    if (!innerMatch) continue;
    const candidate = innerMatch[1].trim();
    if (!/(^|\n)\s*task\s*:/i.test(candidate)) {
      continue;
    }

    const parsed = parseYamlBlock(candidate);
    if (parsed) return parsed;
  }

  return null;
}

function extractTitle(content, fallback) {
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1].trim();
  }
  return fallback;
}

const SECTION_SUMMARY_PATTERNS = [
  /^(purpose|objective|objetivo|goal)$/i,
  /^(overview|summary|resumo|description|descricao)$/i,
];

const METADATA_PREFIX_PATTERN = /^(command|agent|story|ac|task id|phase|tool|owner(?: agent)?|usage|arguments|workflow|integration|related commands|requires|uses|updates)\b/i;

function cleanSummaryLine(rawLine) {
  let text = String(rawLine || '').trim();
  if (!text) return '';

  text = text.replace(/^>\s*/, '');
  text = text.replace(/^[-*+]\s+/, '');
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  text = text.replace(/`([^`]+)`/g, '$1');
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');
  text = text.replace(/\*([^*]+)\*/g, '$1');
  text = text.replace(/_([^_]+)_/g, '$1');
  text = text.replace(/<[^>]+>/g, '');
  text = text.replace(/\s+/g, ' ').trim();

  text = text.replace(
    /^(purpose|objective|objetivo|goal|overview|summary|resumo|description|descricao)\s*:\s*/i,
    '',
  );

  return text.trim();
}

function isTableLine(rawLine) {
  const trimmed = String(rawLine || '').trim();
  if (!trimmed) return false;
  if (/^\|.*\|$/.test(trimmed)) return true;
  if (/^:?-{3,}:?$/.test(trimmed)) return true;
  return false;
}

function isMetadataLine(rawLine, cleanedLine) {
  const raw = String(rawLine || '').trim();
  const cleaned = String(cleanedLine || '').trim();
  if (!cleaned) return true;
  if (/^[_*-]{3,}$/.test(raw)) return true;
  if (isTableLine(raw)) return true;
  if (/^!\[[^\]]*\]\([^)]+\)/.test(raw)) return true;
  if (/^choose your execution mode\b/i.test(cleaned)) return true;
  if (/^task id\s*:/i.test(cleaned)) return true;
  if (METADATA_PREFIX_PATTERN.test(cleaned) && cleaned.includes(':')) return true;
  if (/^\*[\w-]+(?:\s+\{[^}]+\})?$/i.test(cleaned)) return true;
  return false;
}

function extractFirstMeaningfulLine(lines) {
  let inCodeBlock = false;

  for (const line of lines || []) {
    const trimmed = String(line || '').trim();

    if (!trimmed) continue;

    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) continue;
    if (trimmed.startsWith('#')) continue;
    if (/^---+$/.test(trimmed)) continue;

    const cleaned = cleanSummaryLine(trimmed);
    if (isMetadataLine(trimmed, cleaned)) continue;

    if (cleaned.length >= 8) {
      return cleaned;
    }
  }

  return '';
}

function findSectionLines(content, headingPattern) {
  const lines = String(content || '').split(/\r?\n/);
  let start = -1;

  for (let i = 0; i < lines.length; i += 1) {
    const headingMatch = lines[i].match(/^##+\s+(.+)$/);
    if (!headingMatch) continue;
    const heading = headingMatch[1].replace(/[#*`]/g, '').trim();
    if (headingPattern.test(heading)) {
      start = i + 1;
      break;
    }
  }

  if (start === -1) return [];

  const sectionLines = [];
  for (let i = start; i < lines.length; i += 1) {
    if (/^##+\s+/.test(lines[i])) break;
    sectionLines.push(lines[i]);
  }

  return sectionLines;
}

function extractSummary(content) {
  const body = String(content || '');

  for (const pattern of SECTION_SUMMARY_PATTERNS) {
    const sectionLines = findSectionLines(body, pattern);
    const fromSection = extractFirstMeaningfulLine(sectionLines);
    if (fromSection) {
      return fromSection;
    }
  }

  return extractFirstMeaningfulLine(body.split(/\r?\n/));
}

function extractCommandHint(content) {
  const raw = String(content || '');
  const patterns = [
    /(?:^|\n)\s*>\s*\*\*Command:\*\*\s*`([^`]+)`/i,
    /(?:^|\n)\s*\*\*Command:\*\*\s*`([^`]+)`/i,
  ];

  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (!match || !match[1]) continue;
    const command = cleanSummaryLine(match[1]);
    if (command) return command;
  }

  return '';
}

function detectElicit({ frontmatter, taskDefinition, rawContent }) {
  if (frontmatter && typeof frontmatter === 'object' && frontmatter.elicit === true) {
    return true;
  }

  if (taskDefinition && typeof taskDefinition === 'object' && taskDefinition.elicit === true) {
    return true;
  }

  return /(^|\n)\s*elicit\s*:\s*true\b/i.test(rawContent);
}

function parseTaskFile(filePath) {
  const result = {
    path: filePath,
    filename: path.basename(filePath),
    id: path.basename(filePath, '.md'),
    title: '',
    summary: '',
    command: '',
    frontmatter: null,
    taskDefinition: null,
    elicit: false,
    raw: null,
    error: null,
  };

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    result.raw = content;

    const { frontmatter, body } = extractFrontmatter(content);
    result.frontmatter = frontmatter;
    result.taskDefinition = extractInlineYamlTaskDefinition(content);
    result.title = extractTitle(body, result.id);
    result.summary = extractSummary(body);
    result.command = extractCommandHint(body);
    result.elicit = detectElicit({
      frontmatter,
      taskDefinition: result.taskDefinition,
      rawContent: content,
    });
  } catch (error) {
    result.error = error.message;
  }

  return result;
}

function parseAllTasks(tasksDir) {
  if (!fs.existsSync(tasksDir)) {
    console.error(`Tasks directory not found: ${tasksDir}`);
    return [];
  }

  const files = fs.readdirSync(tasksDir)
    .filter((file) => file.endsWith('.md'))
    .sort((a, b) => a.localeCompare(b));
  return files.map((file) => parseTaskFile(path.join(tasksDir, file)));
}

module.exports = {
  parseAllTasks,
  parseTaskFile,
  extractFrontmatter,
  extractInlineYamlTaskDefinition,
  extractTitle,
  extractSummary,
  extractCommandHint,
  cleanSummaryLine,
  isMetadataLine,
  extractFirstMeaningfulLine,
  findSectionLines,
  detectElicit,
};
