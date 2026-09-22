#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { fileURLToPath } from 'node:url';

import { BASE_PLUGIN_VERSION, validateWorkflowState } from '../runtime/validate-workflow-state.mjs';
import { validateEval } from '../../evals/runners/run-behavioral-evals.mjs';

const EXPECTED_SKILLS = [
  'controlled-development',
  'project-discovery',
  'change-definition',
  'solution-design',
  'implementation-planning',
  'incremental-build',
  'change-verification',
  'spec-compliance-review',
  'engineering-review',
  'learning-retrospective',
  'repository-bootstrap',
];
const DECISION_EVIDENCE_POLICY = '../../references/policies/decision-evidence-policy.md';

const REQUIRED_TEMPLATES = [
  'spec.md',
  'solution.md',
  'plan.md',
  'tasks.md',
  'state.json',
  'evidence.md',
  'final-review.md',
  'learning-retrospective.md',
  'execution-policy.json',
];
const REQUIRED_PACKAGE_FILES = [
  'scripts/runtime/validate-workflow-state.mjs',
  'scripts/runtime/workflow-controller.mjs',
  'scripts/runtime/workflow-controller-core.mjs',
  'scripts/runtime/workflow-crypto.mjs',
  'scripts/runtime/workflow-ledger.mjs',
  'scripts/runtime/workflow-rules.mjs',
  'scripts/runtime/workflow-state-store.mjs',
  'scripts/validators/validate-plugin.mjs',
  'scripts/validators/validate-learning-retrospective.mjs',
  'evals/runners/run-trigger-evals.mjs',
  'evals/runners/run-behavioral-evals.mjs',
  'tests/unit/validate-plugin.test.mjs',
  'tests/unit/workflow-controller.test.mjs',
  'tests/unit/workflow-rules.test.mjs',
];

const PLUGIN_VERSION_PATTERN = /^0\.1\.0(?:\+codex\.[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

function readJson(filePath, errors) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    errors.push(`${relative(filePath)} is not valid JSON: ${error.message}`);
    return null;
  }
}

let validationRoot = process.cwd();

function relative(filePath) {
  return path.relative(validationRoot, filePath).replaceAll('\\', '/');
}

function requiredFile(filePath, errors) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    errors.push(`missing file: ${relative(filePath)}`);
    return false;
  }
  return true;
}

function parseFrontmatter(contents, filePath, errors) {
  const match = contents.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    errors.push(`${relative(filePath)} has invalid YAML frontmatter boundaries`);
    return null;
  }

  const result = {};
  for (const rawLine of match[1].split(/\r?\n/)) {
    if (!rawLine.trim()) continue;
    const separator = rawLine.indexOf(':');
    if (separator < 1) {
      errors.push(`${relative(filePath)} has unsupported frontmatter line: ${rawLine}`);
      continue;
    }
    const key = rawLine.slice(0, separator).trim();
    const value = rawLine.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
    result[key] = value;
  }
  return result;
}

function validateManifest(root, errors) {
  const portablePath = path.join(root, 'plugin.json');
  const compatibilityPath = path.join(root, '.codex-plugin', 'plugin.json');
  if (!requiredFile(portablePath, errors) || !requiredFile(compatibilityPath, errors)) return;
  const portable = readJson(portablePath, errors);
  const compatibility = readJson(compatibilityPath, errors);
  if (!portable || !compatibility) return;

  if (portable.$schema !== 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json') {
    errors.push('portable plugin manifest must declare the Agent Plugins 1.0.0 schema');
  }
  for (const [label, manifest] of [['portable', portable], ['compatibility', compatibility]]) {
    if (manifest.name !== 'controlled-development') {
      errors.push(`${label} plugin manifest name must be controlled-development`);
    }
    if (typeof manifest.version !== 'string' || !PLUGIN_VERSION_PATTERN.test(manifest.version)) {
      errors.push(`${label} plugin manifest version must be ${BASE_PLUGIN_VERSION} or a Codex cachebuster based on it`);
    }
  }
  if (compatibility.skills !== './skills/') {
    errors.push('compatibility plugin manifest skills path must be ./skills/');
  }
  if (portable.skills !== undefined) {
    errors.push('portable plugin manifest must use fixed root skills/ discovery instead of a skills field');
  }
  const portableOpenAi = portable.extensions?.['com.openai'];
  if (!portableOpenAi || typeof portableOpenAi !== 'object' || Array.isArray(portableOpenAi)) {
    errors.push('portable plugin manifest must define extensions.com.openai');
  }
  const portableInterface = portableOpenAi?.interface;
  validateManifestHooks(portableOpenAi?.hooks, 'portable extensions.com.openai.hooks', root, errors);
  validateManifestHooks(compatibility.hooks, 'compatibility hooks', root, errors);
  for (const [label, manifest, pluginInterface] of [
    ['portable', portableOpenAi ?? {}, portableInterface],
    ['compatibility', compatibility, compatibility.interface],
  ]) {
    if (['mcpServers', 'apps'].some((field) => Object.hasOwn(manifest, field))) {
      errors.push(`${label} manifest must not declare MCP servers or apps`);
    }
    if (!Array.isArray(pluginInterface?.capabilities)) {
      errors.push(`${label} plugin interface capabilities must be an array`);
    }
    if (!Array.isArray(pluginInterface?.defaultPrompt)) {
      errors.push(`${label} plugin interface defaultPrompt must be an array`);
    } else if (pluginInterface.defaultPrompt.length > 3) {
      errors.push(`${label} plugin interface defaultPrompt must contain at most 3 entries`);
    }
  }
  for (const field of ['name', 'version', 'description']) {
    if (portable[field] !== compatibility[field]) {
      errors.push(`portable and compatibility manifests must share ${field}`);
    }
  }
  if (portable.author?.name !== compatibility.author?.name) {
    errors.push('portable and compatibility manifests must share author.name');
  }
  if (!isDeepStrictEqual(portableInterface, compatibility.interface)) {
    errors.push('portable and compatibility manifests must share the same OpenAI interface metadata');
  }
}

function validateManifestHooks(value, label, root, errors) {
  if (typeof value !== 'string' || !value.startsWith('./')) {
    errors.push(`${label} must be a ./-prefixed path`);
    return;
  }
  const resolved = path.resolve(root, value.slice(2));
  if (!resolved.startsWith(path.resolve(root) + path.sep)) {
    errors.push(`${label} must stay inside plugin root`);
    return;
  }
  if (!requiredFile(resolved, errors)) return;
  const config = readJson(resolved, errors);
  if (!config || !config.hooks || typeof config.hooks !== 'object' || Array.isArray(config.hooks)) {
    errors.push(`${relative(resolved)} must define a hooks object`);
    return;
  }
  for (const event of ['SessionStart', 'PreToolUse', 'PostToolUse', 'Stop']) {
    if (!Array.isArray(config.hooks[event]) || config.hooks[event].length === 0) {
      errors.push(`${relative(resolved)} must define a non-empty ${event} hook list`);
    }
  }
}

function validateSkills(root, errors) {
  const skillsRoot = path.join(root, 'skills');
  const knownSkills = new Set(EXPECTED_SKILLS);

  for (const skillName of EXPECTED_SKILLS) {
    const skillPath = path.join(skillsRoot, skillName, 'SKILL.md');
    if (!requiredFile(skillPath, errors)) continue;
    const agentPath = path.join(skillsRoot, skillName, 'agents', 'openai.yaml');
    requiredFile(agentPath, errors);
    const contents = fs.readFileSync(skillPath, 'utf8');
    const frontmatter = parseFrontmatter(contents, skillPath, errors);
    if (!frontmatter) continue;
    if (frontmatter.name !== skillName) {
      errors.push(`${relative(skillPath)} name must match its directory`);
    }
    if (!frontmatter.description || frontmatter.description.length > 1024) {
      errors.push(`${relative(skillPath)} needs a 1-1024 character description`);
    }
    if (!frontmatter.description?.includes('Use when')) {
      errors.push(`${relative(skillPath)} description must contain Use when triggers`);
    }
    if (!contents.includes('../../references/policies/output-language-policy.md')) {
      errors.push(`${relative(skillPath)} must apply the output language policy`);
    }
    if (!contents.includes(DECISION_EVIDENCE_POLICY)) {
      errors.push(`${relative(skillPath)} must apply the decision evidence policy`);
    }
    for (const heading of ['## Overview', '## Common Rationalizations', '## Red Flags', '## Verification']) {
      if (!contents.includes(heading)) {
        errors.push(`${relative(skillPath)} is missing ${heading}`);
      }
    }
    if (contents.split(/\r?\n/).length > 500) {
      errors.push(`${relative(skillPath)} exceeds 500 lines`);
    }
    if (skillName === 'repository-bootstrap' && fs.existsSync(agentPath)) {
      const agentContents = fs.readFileSync(agentPath, 'utf8');
      if (!/allow_implicit_invocation:\s*false/.test(agentContents)) {
        errors.push('skills/repository-bootstrap/agents/openai.yaml must disable implicit invocation');
      }
      if (!contents.includes('## One-Invocation Continuation')) {
        errors.push('skills/repository-bootstrap/SKILL.md must define one-invocation continuation');
      }
      if (!contents.includes('do not ask the user to invoke `$repository-bootstrap` again')) {
        errors.push('skills/repository-bootstrap/SKILL.md must forbid same-task re-invocation prompts');
      }
    }
    if (skillName === 'controlled-development') {
      for (const marker of ['workflow-controller.mjs', '--expected-revision', 'must not edit them directly']) {
        if (!contents.includes(marker)) {
          errors.push(`skills/controlled-development/SKILL.md missing controller ownership marker: ${marker}`);
        }
      }
    }
    validateMarkdownLinks(skillPath, contents, root, errors);
  }

  const actualSkills = fs.existsSync(skillsRoot)
    ? fs.readdirSync(skillsRoot).filter((entry) => fs.statSync(path.join(skillsRoot, entry)).isDirectory())
    : [];
  for (const skillName of actualSkills) {
    if (!knownSkills.has(skillName)) errors.push(`unexpected skill directory: skills/${skillName}`);
  }
}

function validateMarkdownLinks(filePath, contents, root, errors) {
  const linkPattern = /\[[^\]]+\]\(([^)]+)\)/g;
  for (const match of contents.matchAll(linkPattern)) {
    const target = match[1].split('#')[0];
    if (!target || /^(?:https?:|mailto:)/.test(target)) continue;
    const resolved = path.resolve(path.dirname(filePath), target);
    if (!resolved.startsWith(path.resolve(root) + path.sep) && resolved !== path.resolve(root)) {
      errors.push(`${relative(filePath)} link escapes plugin root: ${match[1]}`);
    } else if (!fs.existsSync(resolved)) {
      errors.push(`${relative(filePath)} has missing link target: ${match[1]}`);
    }
  }
}

function walk(root) {
  const entries = [];
  for (const child of fs.readdirSync(root, { withFileTypes: true })) {
    const childPath = path.join(root, child.name);
    entries.push(childPath);
    if (child.isDirectory()) entries.push(...walk(childPath));
  }
  return entries;
}

function validateAllMarkdownLinks(root, errors) {
  for (const filePath of walk(root).filter((entry) => entry.endsWith('.md') && fs.statSync(entry).isFile())) {
    validateMarkdownLinks(filePath, fs.readFileSync(filePath, 'utf8'), root, errors);
  }
}

function validateNoEmptyDirectories(root, errors) {
  for (const directory of walk(root).filter((entry) => fs.statSync(entry).isDirectory())) {
    if (fs.readdirSync(directory).length === 0) {
      errors.push(`empty directory: ${relative(directory)}`);
    }
  }
}

function validateTemplates(root, errors) {
  for (const template of REQUIRED_TEMPLATES) {
    requiredFile(path.join(root, 'assets', 'workflow-templates', template), errors);
  }

  const retrospectiveTemplatePath = path.join(root, 'assets', 'workflow-templates', 'learning-retrospective.md');
  if (fs.existsSync(retrospectiveTemplatePath)) {
    const contents = fs.readFileSync(retrospectiveTemplatePath, 'utf8');
    for (const marker of [
      'status: "proposed"',
      'classification: "PLUGIN CANDIDATE"',
      'pluginMutation: "none"',
      '## Evidence',
      '## Proposed plugin targets',
      '## Proposed eval',
      '## Overgeneralization risk',
      '## Approval boundary',
    ]) {
      if (!contents.includes(marker)) {
        errors.push(`assets/workflow-templates/learning-retrospective.md missing required marker: ${marker}`);
      }
    }
  }
  const solutionTemplatePath = path.join(root, 'assets', 'workflow-templates', 'solution.md');
  if (fs.existsSync(solutionTemplatePath)) {
    const contents = fs.readFileSync(solutionTemplatePath, 'utf8');
    for (const marker of [
      '## Decision drivers',
      '## Quality scenarios',
      '## Các giải pháp được xem xét',
      '## Giải pháp khuyến nghị',
      '## Verification conditions',
      '## Revisit conditions',
      '## Phê duyệt giải pháp',
    ]) {
      if (!contents.includes(marker)) {
        errors.push(`assets/workflow-templates/solution.md missing required marker: ${marker}`);
      }
    }
  }
  const statePath = path.join(root, 'assets', 'workflow-templates', 'state.json');
  if (fs.existsSync(statePath)) {
    const state = readJson(statePath, errors);
    if (state) {
      errors.push(...validateWorkflowState(state, 'assets/workflow-templates/state.json'));
      if (state.reviewRemediationCycle !== 0) {
        errors.push('state template must start at remediation cycle 0');
      }
    }
  }
}

function validateScripts(root, errors) {
  for (const file of REQUIRED_PACKAGE_FILES) {
    requiredFile(path.join(root, file), errors);
  }
}

function validateEvals(root, errors) {
  const casesRoot = path.join(root, 'evals', 'cases');
  for (const skillName of EXPECTED_SKILLS) {
    const casePath = path.join(casesRoot, `${skillName}.json`);
    if (!requiredFile(casePath, errors)) continue;
    const evalCase = readJson(casePath, errors);
    if (!evalCase) continue;
    if (evalCase.skill_name !== skillName) {
      errors.push(`${relative(casePath)} skill_name must be ${skillName}`);
    }
    if (!Array.isArray(evalCase.trigger?.positive) || evalCase.trigger.positive.length < 3) {
      errors.push(`${relative(casePath)} needs at least 3 positive triggers`);
    }
    if (!Array.isArray(evalCase.trigger?.negative) || evalCase.trigger.negative.length < 2) {
      errors.push(`${relative(casePath)} needs at least 2 negative triggers`);
    } else {
      for (const negative of evalCase.trigger.negative) {
        if (!EXPECTED_SKILLS.includes(negative.owner)) {
          errors.push(`${relative(casePath)} has unknown negative owner: ${negative.owner}`);
        }
      }
    }
    if (!Array.isArray(evalCase.evals) || evalCase.evals.length < 1) {
      errors.push(`${relative(casePath)} needs at least 1 behavioral eval`);
      continue;
    }
    for (const behavior of evalCase.evals) {
      try {
        validateEval(evalCase.skill_name, behavior, root);
      } catch (error) {
        errors.push(`${relative(casePath)} eval ${behavior.id}: ${error.message}`);
      }
      if (!['dialogue', 'execution'].includes(behavior.kind)) {
        errors.push(`${relative(casePath)} eval ${behavior.id} has invalid kind`);
      }
      if (!Array.isArray(behavior.expectations) || behavior.expectations.length < 1) {
        errors.push(`${relative(casePath)} eval ${behavior.id} needs expectations`);
      }
      if (behavior.kind === 'execution') {
        if (!Array.isArray(behavior.files) || behavior.files.length < 1) {
          errors.push(`${relative(casePath)} execution eval ${behavior.id} needs fixture files`);
        } else {
          for (const fixture of behavior.files) {
            const fixturePath = path.resolve(root, 'tests', 'fixtures', fixture);
            const fixturesRoot = path.resolve(root, 'tests', 'fixtures');
            if (!fixturePath.startsWith(fixturesRoot + path.sep) || !fs.existsSync(fixturePath)) {
              errors.push(`${relative(casePath)} eval ${behavior.id} references missing fixture: ${fixture}`);
            }
          }
        }
      }
    }
  }
}

function validateStateExamples(root, errors) {
  const validStatePath = path.join(root, 'tests', 'fixtures', 'workflow-state', 'valid-state.json');
  if (!requiredFile(validStatePath, errors)) return;
  const state = readJson(validStatePath, errors);
  if (!state) return;
  errors.push(...validateWorkflowState(state, 'valid-state.json'));

  const invalidStatePath = path.join(root, 'tests', 'fixtures', 'workflow-state', 'invalid-state.json');
  if (!requiredFile(invalidStatePath, errors)) return;
  const invalidState = readJson(invalidStatePath, errors);
  if (!invalidState) return;
  const expectedErrors = validateWorkflowState(invalidState, 'invalid-state.json');
  if (!expectedErrors.some((error) => error.includes('requires approved spec')) ||
      !expectedErrors.some((error) => error.includes('requires approved plan'))) {
    errors.push('invalid-state.json must demonstrate approval-gate rejection');
  }

  const remediationStatePath = path.join(root, 'tests', 'fixtures', 'workflow-state', 'remediation-state.json');
  if (!requiredFile(remediationStatePath, errors)) return;
  const remediationState = readJson(remediationStatePath, errors);
  if (remediationState) {
    errors.push(...validateWorkflowState(remediationState, 'remediation-state.json'));
  }

  const retrospectiveStatePath = path.join(root, 'tests', 'fixtures', 'workflow-state', 'learning-retrospective-state.json');
  if (!requiredFile(retrospectiveStatePath, errors)) return;
  const retrospectiveState = readJson(retrospectiveStatePath, errors);
  if (retrospectiveState) errors.push(...validateWorkflowState(retrospectiveState, 'learning-retrospective-state.json'));

  for (const fixture of ['blocker-limit-state.json', 'remediation-limit-state.json']) {
    const fixturePath = path.join(root, 'tests', 'fixtures', 'workflow-state', fixture);
    if (!requiredFile(fixturePath, errors)) continue;
    const fixtureState = readJson(fixturePath, errors);
    if (fixtureState) errors.push(...validateWorkflowState(fixtureState, fixture));
  }
}

function validateForbiddenStructure(root, errors) {
  for (const optionalPath of ['agents', '.mcp.json', '.app.json']) {
    if (fs.existsSync(path.join(root, optionalPath))) {
      errors.push(`V1 must not include ${optionalPath}`);
    }
  }
}

export function validatePlugin(root) {
  validationRoot = path.resolve(root);
  const errors = [];
  validateManifest(validationRoot, errors);
  validateTemplates(validationRoot, errors);
  validateScripts(validationRoot, errors);
  validateSkills(validationRoot, errors);
  validateAllMarkdownLinks(validationRoot, errors);
  validateEvals(validationRoot, errors);
  validateStateExamples(validationRoot, errors);
  validateForbiddenStructure(validationRoot, errors);
  validateNoEmptyDirectories(validationRoot, errors);
  return errors.sort();
}

function main() {
  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
  const root = path.resolve(process.argv[2] ?? path.join(scriptDirectory, '..', '..'));
  const errors = validatePlugin(root);
  if (errors.length) {
    console.error(`Controlled Development validation failed with ${errors.length} error(s):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Controlled Development validation passed: ${root}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
