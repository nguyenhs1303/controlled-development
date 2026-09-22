#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REQUIRED_FRONTMATTER = [
  'schemaVersion',
  'candidateId',
  'status',
  'classification',
  'changeId',
  'generatedAt',
  'pluginMutation',
];

const REQUIRED_HEADINGS = [
  '## Observation',
  '## Evidence',
  '## Durability test',
  '## Existing coverage',
  '## Proposed plugin targets',
  '## Proposed eval',
  '## Applicability',
  '## Overgeneralization risk',
  '## Open questions',
  '## Approval boundary',
];

function parseFrontmatter(contents, label, errors) {
  const match = contents.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    errors.push(`${label} has invalid YAML frontmatter boundaries`);
    return null;
  }

  const values = {};
  for (const rawLine of match[1].split(/\r?\n/)) {
    if (!rawLine.trim()) continue;
    const separator = rawLine.indexOf(':');
    if (separator < 1) {
      errors.push(`${label} has unsupported frontmatter line: ${rawLine}`);
      continue;
    }
    const key = rawLine.slice(0, separator).trim();
    const value = rawLine.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
    values[key] = value;
  }
  return values;
}

function sectionBody(contents, heading) {
  const start = contents.indexOf(heading);
  if (start < 0) return '';
  const bodyStart = start + heading.length;
  const remainder = contents.slice(bodyStart);
  const nextHeading = remainder.search(/\r?\n## /);
  return (nextHeading < 0 ? remainder : remainder.slice(0, nextHeading)).trim();
}

export function validateLearningRetrospective(contents, label = 'learning-retrospective.md') {
  const errors = [];
  if (typeof contents !== 'string' || !contents.trim()) return [`${label} must be non-empty text`];

  const frontmatter = parseFrontmatter(contents, label, errors);
  if (frontmatter) {
    for (const field of REQUIRED_FRONTMATTER) {
      if (!Object.hasOwn(frontmatter, field) || !frontmatter[field]) {
        errors.push(`${label} missing frontmatter field: ${field}`);
      }
    }
    if (frontmatter.schemaVersion !== '1') errors.push(`${label} schemaVersion must be 1`);
    if (!/^LR-[0-9]{3,}$/.test(frontmatter.candidateId ?? '')) {
      errors.push(`${label} candidateId must match LR- followed by at least three digits`);
    }
    if (frontmatter.status !== 'proposed') errors.push(`${label} status must be proposed`);
    if (frontmatter.classification !== 'PLUGIN CANDIDATE') {
      errors.push(`${label} classification must be PLUGIN CANDIDATE`);
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(frontmatter.changeId ?? '')) {
      errors.push(`${label} changeId must be lowercase kebab-case`);
    }
    if (Number.isNaN(Date.parse(frontmatter.generatedAt ?? ''))) {
      errors.push(`${label} generatedAt must be an ISO timestamp`);
    }
    if (frontmatter.pluginMutation !== 'none') errors.push(`${label} pluginMutation must be none`);
  }

  for (const heading of REQUIRED_HEADINGS) {
    if (!contents.includes(heading)) errors.push(`${label} is missing ${heading}`);
  }

  for (const heading of REQUIRED_HEADINGS.filter((item) => item !== '## Open questions')) {
    const body = sectionBody(contents, heading);
    if (!body || /\{\{[^}]+\}\}/.test(body)) errors.push(`${label} ${heading} must be completed`);
  }

  const evidence = sectionBody(contents, '## Evidence');
  if (!/^[-*]\s+`[^`]+`\s+-\s+\S/m.test(evidence)) {
    errors.push(`${label} Evidence must contain a concrete backticked pointer and explanation`);
  }
  const targets = sectionBody(contents, '## Proposed plugin targets');
  if (!/^[-*]\s+`[^`]+`\s+-\s+\S/m.test(targets)) {
    errors.push(`${label} Proposed plugin targets must name a plugin-relative path and correction`);
  }
  const proposedEval = sectionBody(contents, '## Proposed eval');
  if (!/^[-*]\s+\S/m.test(proposedEval)) {
    errors.push(`${label} Proposed eval must contain at least one concrete case`);
  }
  if (/\{\{[^}]+\}\}/.test(contents)) errors.push(`${label} contains unresolved template placeholders`);

  return errors.sort();
}

function main() {
  const target = process.argv[2];
  if (!target) {
    console.error('Usage: node validate-learning-retrospective.mjs <learning-retrospective.md>');
    process.exitCode = 2;
    return;
  }

  const targetPath = path.resolve(target);
  let contents;
  try {
    contents = fs.readFileSync(targetPath, 'utf8');
  } catch (error) {
    console.error(`Learning retrospective validation failed: ${error.message}`);
    process.exitCode = 1;
    return;
  }

  const errors = validateLearningRetrospective(contents, path.basename(targetPath));
  if (errors.length) {
    console.error(`Learning retrospective validation failed with ${errors.length} error(s):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Learning retrospective validation passed: ${targetPath}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();

