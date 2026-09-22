#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'before', 'but', 'by', 'do', 'for',
  'from', 'has', 'have', 'i', 'in', 'is', 'it', 'me', 'of', 'on', 'or', 'the',
  'this', 'to', 'use', 'when', 'with', 'you', 'your',
]);

function stem(token) {
  return token
    .replace(/(?:ization|ational|fulness|ousness|iveness|tional)$/u, '')
    .replace(/(?:ments|ment|ingly|edly|ing|ed|es|s)$/u, '')
    .replace(/(?:ity|ive|ous|al|er)$/u, '');
}

function tokens(text) {
  return new Set(
    text
      .toLowerCase()
      .match(/[a-z0-9]+(?:-[a-z0-9]+)*/g)
      ?.flatMap((token) => token.split('-'))
      .map(stem)
      .filter((token) => token.length > 1 && !STOP_WORDS.has(token)) ?? [],
  );
}

function parseDescription(skillPath) {
  const contents = fs.readFileSync(skillPath, 'utf8');
  const match = contents.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return '';
  const descriptionLine = match[1].split(/\r?\n/).find((line) => line.startsWith('description:'));
  return descriptionLine?.slice('description:'.length).trim() ?? '';
}

function score(promptTokens, descriptionTokens) {
  let overlap = 0;
  for (const token of promptTokens) if (descriptionTokens.has(token)) overlap += 1;
  return overlap / Math.sqrt(Math.max(1, descriptionTokens.size));
}

export function runTriggerEvals(root) {
  const skillsRoot = path.join(root, 'skills');
  const casesRoot = path.join(root, 'evals', 'cases');
  const descriptions = new Map();
  for (const skillName of fs.readdirSync(skillsRoot)) {
    const skillPath = path.join(skillsRoot, skillName, 'SKILL.md');
    if (fs.existsSync(skillPath)) descriptions.set(skillName, tokens(parseDescription(skillPath)));
  }

  const errors = [];
  let positiveCount = 0;
  let rankOneCount = 0;
  for (const caseFile of fs.readdirSync(casesRoot).filter((file) => file.endsWith('.json')).sort()) {
    const evalCase = JSON.parse(fs.readFileSync(path.join(casesRoot, caseFile), 'utf8'));
    for (const positive of evalCase.trigger.positive) {
      positiveCount += 1;
      const ranked = rank(positive.prompt, descriptions);
      const targetRank = ranked.findIndex(([name]) => name === evalCase.skill_name) + 1;
      if (targetRank === 1) rankOneCount += 1;
      if (targetRank < 1 || targetRank > (positive.top_k ?? 3)) {
        errors.push(`${caseFile} positive did not route top-${positive.top_k ?? 3}: ${positive.prompt} (rank ${targetRank || 'none'})`);
      }
    }
    for (const negative of evalCase.trigger.negative) {
      const ranked = rank(negative.prompt, descriptions);
      const ownerRank = ranked.findIndex(([name]) => name === negative.owner);
      const targetRank = ranked.findIndex(([name]) => name === evalCase.skill_name);
      if (ownerRank < 0 || targetRank < 0 || ownerRank >= targetRank) {
        errors.push(`${caseFile} negative owner ${negative.owner} did not outrank ${evalCase.skill_name}: ${negative.prompt}`);
      }
    }
  }

  return { errors, positiveCount, rankOneCount };
}

function rank(prompt, descriptions) {
  const promptTokens = tokens(prompt);
  return [...descriptions.entries()]
    .map(([name, descriptionTokens]) => [name, score(promptTokens, descriptionTokens)])
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
}

function main() {
  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
  const root = path.resolve(process.argv[2] ?? path.join(scriptDirectory, '..', '..'));
  const result = runTriggerEvals(root);
  if (result.errors.length) {
    console.error(`Trigger evals failed with ${result.errors.length} error(s):`);
    for (const error of result.errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Trigger evals passed: ${result.positiveCount} positives, ${result.rankOneCount} rank-1`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
