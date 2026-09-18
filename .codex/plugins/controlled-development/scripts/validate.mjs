#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  effectivePlanApprovalRequired,
  expectedPredecessorsForState,
  planApprovalRequired,
  usesSolutionWorkflow,
} from './workflow-rules.mjs';

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
const DECISION_EVIDENCE_POLICY = '../../references/decision-evidence-policy.md';

const REQUIRED_TEMPLATES = [
  'spec.md',
  'solution.md',
  'plan.md',
  'tasks.md',
  'state.json',
  'evidence.md',
  'final-review.md',
  'learning-retrospective.md',
];
const REQUIRED_SCRIPTS = [
  'validate.mjs',
  'validate.test.mjs',
  'workflow-controller.mjs',
  'workflow-controller-core.mjs',
  'workflow-controller.test.mjs',
  'workflow-crypto.mjs',
  'workflow-ledger.mjs',
  'workflow-rules.mjs',
  'workflow-rules.test.mjs',
  'workflow-state-store.mjs',
  'run-trigger-evals.mjs',
  'run-behavioral-evals.mjs',
  'validate-learning-retrospective.mjs',
];

const BASE_PLUGIN_VERSION = '0.1.0';
const PLUGIN_VERSION_PATTERN = /^0\.1\.0(?:\+codex\.[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const SUPPORTED_SCHEMA_VERSIONS = new Set([1, 2, 3]);
const SHA256_DIGEST_PATTERN = /^sha256:[0-9a-f]{64}$/;
const APPROVAL_ARTIFACTS = {
  spec: 'spec.md',
  solution: 'solution.md',
  plan: 'plan.md',
};
const PHASES = new Set([
  'BOOTSTRAP', 'INTAKE', 'DISCOVER', 'TRIAGE', 'DEFINE', 'SPEC APPROVAL',
  'SOLUTION DESIGN', 'SOLUTION APPROVAL', 'PLAN', 'PLAN APPROVAL',
  'BUILD', 'VERIFY', 'REVIEW', 'AUTO-REMEDIATE',
  'RE-VERIFY', 'RE-REVIEW', 'LEARNING RETROSPECTIVE', 'FINAL REPORT', 'STOP',
]);
const TERMINAL_STATES = new Set(['REVIEW PASSED', 'REVIEW BLOCKED', 'IMPLEMENTATION BLOCKED']);
const TASK_STATUSES = new Set(['todo', 'in-progress', 'done', 'blocked', 'not-applicable']);
const WRITE_PHASES = new Set([
  'BUILD', 'VERIFY', 'REVIEW', 'AUTO-REMEDIATE', 'RE-VERIFY', 'RE-REVIEW',
  'LEARNING RETROSPECTIVE', 'FINAL REPORT', 'STOP',
]);
const POST_SPEC_APPROVAL_PHASES = new Set([
  'SOLUTION DESIGN', 'SOLUTION APPROVAL', 'PLAN', 'PLAN APPROVAL', ...WRITE_PHASES,
]);
const POST_SOLUTION_APPROVAL_PHASES = new Set([
  'PLAN', 'PLAN APPROVAL', ...WRITE_PHASES,
]);
const ABSOLUTE_PROHIBITIONS = [
  'git-add',
  'git-commit',
  'git-push',
  'pull-request',
  'merge',
  'release',
  'deploy',
  'production-access',
  'real-data-mutation',
];

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
  const manifestPath = path.join(root, '.codex-plugin', 'plugin.json');
  if (!requiredFile(manifestPath, errors)) return;
  const manifest = readJson(manifestPath, errors);
  if (!manifest) return;

  if (manifest.name !== 'controlled-development') {
    errors.push('plugin manifest name must be controlled-development');
  }
  if (typeof manifest.version !== 'string' || !PLUGIN_VERSION_PATTERN.test(manifest.version)) {
    errors.push(`plugin manifest version must be ${BASE_PLUGIN_VERSION} or a Codex cachebuster based on it`);
  }
  if (manifest.skills !== './skills/') {
    errors.push('plugin manifest skills path must be ./skills/');
  }
  if (manifest.hooks || manifest.mcpServers || manifest.apps) {
    errors.push('V1 manifest must not declare hooks, MCP servers, or apps');
  }
  if (!Array.isArray(manifest.interface?.capabilities)) {
    errors.push('plugin interface capabilities must be an array');
  }
  if (!Array.isArray(manifest.interface?.defaultPrompt)) {
    errors.push('plugin interface defaultPrompt must be an array');
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
    if (!contents.includes('../../references/output-language-policy.md')) {
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
    requiredFile(path.join(root, 'templates', template), errors);
  }

  const retrospectiveTemplatePath = path.join(root, 'templates', 'learning-retrospective.md');
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
        errors.push(`templates/learning-retrospective.md missing required marker: ${marker}`);
      }
    }
  }
  const solutionTemplatePath = path.join(root, 'templates', 'solution.md');
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
        errors.push(`templates/solution.md missing required marker: ${marker}`);
      }
    }
  }
  const statePath = path.join(root, 'templates', 'state.json');
  if (fs.existsSync(statePath)) {
    const state = readJson(statePath, errors);
    if (state) {
      errors.push(...validateWorkflowState(state, 'templates/state.json'));
      if (state.reviewRemediationCycle !== 0) {
        errors.push('state template must start at remediation cycle 0');
      }
    }
  }
}

function validateScripts(root, errors) {
  for (const script of REQUIRED_SCRIPTS) {
    requiredFile(path.join(root, 'scripts', script), errors);
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
            const fixturePath = path.resolve(root, 'evals', 'fixtures', fixture);
            const fixturesRoot = path.resolve(root, 'evals', 'fixtures');
            if (!fixturePath.startsWith(fixturesRoot + path.sep) || !fs.existsSync(fixturePath)) {
              errors.push(`${relative(casePath)} eval ${behavior.id} references missing fixture: ${fixture}`);
            }
          }
        }
      }
    }
  }
}

export function validateWorkflowState(state, label = 'state', context = {}) {
  const errors = [];
  if (!isPlainObject(state)) return [`${label} must be a JSON object`];

  const requiredFields = [
    'schemaVersion', 'pluginVersion', 'changeId', 'profile', 'riskLevel', 'phase',
    'terminalState', 'artifactRoot', 'approvedScope', 'prohibitedOperations',
    'approvals', 'tasks', 'currentTaskId', 'blockers', 'reviewRemediationCycle',
    'evidenceReceipts', 'gitBaseline', 'lastCompletedPhase', 'updatedAt',
  ];
  if ([2, 3].includes(state.schemaVersion)) requiredFields.push('triage');
  if (state.schemaVersion === 3) {
    requiredFields.push('revision', 'lastEventSequence', 'lastEventHash');
  }
  for (const field of requiredFields) {
    if (!Object.hasOwn(state, field)) errors.push(`${label} missing required field: ${field}`);
  }

  if (Object.hasOwn(state, 'schemaVersion') && !SUPPORTED_SCHEMA_VERSIONS.has(state.schemaVersion)) {
    errors.push(`${label} schemaVersion must be 1, 2, or 3`);
  }
  if (state.schemaVersion === 1 &&
      ['TRIAGE', 'SOLUTION DESIGN', 'SOLUTION APPROVAL'].includes(state.phase)) {
    errors.push(`${label} schemaVersion 1 cannot use solution-workflow phases`);
  }
  if (state.schemaVersion === 1 &&
      ['TRIAGE', 'SOLUTION DESIGN', 'SOLUTION APPROVAL'].includes(state.lastCompletedPhase)) {
    errors.push(`${label} schemaVersion 1 cannot record solution-workflow predecessors`);
  }
  if (Object.hasOwn(state, 'pluginVersion') && state.pluginVersion !== BASE_PLUGIN_VERSION) {
    errors.push(`${label} pluginVersion must be ${BASE_PLUGIN_VERSION}`);
  }
  if (Object.hasOwn(state, 'changeId') &&
      (!nonEmptyString(state.changeId) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(state.changeId))) {
    errors.push(`${label} changeId must be lowercase filesystem-safe kebab-case`);
  }

  const validProfile = ['quick', 'standard', 'deep'].includes(state.profile);
  const validRisk = ['low', 'medium', 'high'].includes(state.riskLevel);
  if (Object.hasOwn(state, 'profile') && !validProfile) {
    errors.push(`${label} profile must be quick, standard, or deep`);
  }
  if (Object.hasOwn(state, 'riskLevel') && !validRisk) {
    errors.push(`${label} riskLevel must be low, medium, or high`);
  }
  if (validProfile && validRisk) {
    if (state.profile === 'quick' && state.riskLevel !== 'low') {
      errors.push(`${label} quick profile requires low riskLevel`);
    }
    if (state.profile === 'standard' && state.riskLevel === 'high') {
      errors.push(`${label} high riskLevel requires deep profile`);
    }
  }
  const hasSolutionWorkflow = usesSolutionWorkflow(state.schemaVersion);
  if (hasSolutionWorkflow && state.profile === 'quick' &&
      ['DEFINE', 'SPEC APPROVAL', 'SOLUTION DESIGN', 'SOLUTION APPROVAL', 'PLAN', 'PLAN APPROVAL'].includes(state.phase)) {
    errors.push(`${label} Quick must skip specification, solution, and plan phases or escalate profile`);
  }
  if (hasSolutionWorkflow) validateTriage(state.triage, state.profile, label, errors);

  const validPhase = PHASES.has(state.phase);
  if (Object.hasOwn(state, 'phase') && !validPhase) errors.push(`${label} has unknown phase`);
  if (Object.hasOwn(state, 'lastCompletedPhase') &&
      state.lastCompletedPhase !== null && !PHASES.has(state.lastCompletedPhase)) {
    errors.push(`${label} lastCompletedPhase must be null or a known phase`);
  }

  if (Object.hasOwn(state, 'terminalState') &&
      state.terminalState !== null && !TERMINAL_STATES.has(state.terminalState)) {
    errors.push(`${label} has unknown terminal state`);
  }
  if (validPhase && !['FINAL REPORT', 'STOP'].includes(state.phase) && state.terminalState !== null) {
    errors.push(`${label} may set a terminal state only at FINAL REPORT or STOP`);
  }
  if (validPhase && ['FINAL REPORT', 'STOP'].includes(state.phase) &&
      !TERMINAL_STATES.has(state.terminalState)) {
    errors.push(`${label} ${state.phase} requires a terminal state`);
  }

  validateArtifactRoot(state, label, errors);
  validateStringArray(state.approvedScope, 'approvedScope', label, errors);
  validateStringArray(state.prohibitedOperations, 'prohibitedOperations', label, errors);
  if (Array.isArray(state.prohibitedOperations)) {
    for (const operation of ABSOLUTE_PROHIBITIONS) {
      if (!state.prohibitedOperations.includes(operation)) {
        errors.push(`${label} prohibitedOperations must include ${operation}`);
      }
    }
  }

  const requiredPlanApproval = validProfile && validRisk ? planApprovalRequired(state) : null;
  const solutionApprovalRequired = hasSolutionWorkflow && validProfile
    ? state.profile !== 'quick'
    : false;
  validateApprovals(
    state.approvals,
    requiredPlanApproval,
    solutionApprovalRequired,
    hasSolutionWorkflow ? state.profile : null,
    state.schemaVersion === 3,
    label,
    errors,
  );
  const needsPlanApproval = effectivePlanApprovalRequired(state);

  if (!Array.isArray(state.tasks)) {
    if (Object.hasOwn(state, 'tasks')) errors.push(`${label} tasks must be an array`);
  } else {
    const taskIds = new Set();
    for (const [index, task] of state.tasks.entries()) {
      if (!isPlainObject(task) || !nonEmptyString(task.id) || !nonEmptyString(task.status)) {
        errors.push(`${label} tasks[${index}] requires non-empty id and status`);
        continue;
      }
      if (!TASK_STATUSES.has(task.status)) {
        errors.push(`${label} tasks[${index}].status must be todo, in-progress, done, blocked, or not-applicable`);
      }
      if (taskIds.has(task.id)) errors.push(`${label} has duplicate task id: ${task.id}`);
      taskIds.add(task.id);
    }
    if (state.currentTaskId !== null &&
        (!nonEmptyString(state.currentTaskId) || !taskIds.has(state.currentTaskId))) {
      errors.push(`${label} currentTaskId must be null or reference an existing task`);
    }
  }
  if (Object.hasOwn(state, 'currentTaskId') && state.currentTaskId !== null &&
      !nonEmptyString(state.currentTaskId)) {
    errors.push(`${label} currentTaskId must be null or a non-empty string`);
  }

  validateBlockers(state.blockers, label, errors);
  if (!Number.isInteger(state.reviewRemediationCycle) ||
      state.reviewRemediationCycle < 0 || state.reviewRemediationCycle > 3) {
    if (Object.hasOwn(state, 'reviewRemediationCycle')) {
      errors.push(`${label} reviewRemediationCycle exceeds review remediation limit or is invalid`);
    }
  }
  validateStringArray(state.evidenceReceipts, 'evidenceReceipts', label, errors);
  validateGitBaseline(state.gitBaseline, label, errors);
  if (Object.hasOwn(state, 'updatedAt') && state.updatedAt !== null && !isIsoTimestamp(state.updatedAt)) {
    errors.push(`${label} updatedAt must be null or an ISO timestamp string`);
  }
  if (state.schemaVersion === 3) validateSchema3Integrity(state, label, errors);

  if (validPhase) {
    const expectedPredecessors = expectedPredecessorsForState(state);
    if (expectedPredecessors && !expectedPredecessors.includes(state.lastCompletedPhase)) {
      errors.push(`${label} ${state.phase} must follow ${formatChoices(expectedPredecessors)}`);
    }
  }

  if (validPhase && WRITE_PHASES.has(state.phase)) {
    if (needsPlanApproval && state.approvals?.plan?.status !== 'approved') {
      errors.push(`${label} ${state.phase} requires approved plan`);
    }
    if (Array.isArray(state.approvedScope) && state.approvedScope.length === 0) {
      errors.push(`${label} ${state.phase} requires non-empty approvedScope`);
    }
    if (Array.isArray(state.tasks) && state.tasks.length === 0) {
      errors.push(`${label} ${state.phase} requires at least one task`);
    }
    if (!isRecordedGitBaseline(state.gitBaseline)) {
      errors.push(`${label} ${state.phase} requires a recorded gitBaseline`);
    }
  }
  if (validPhase && POST_SPEC_APPROVAL_PHASES.has(state.phase) &&
      !(hasSolutionWorkflow && state.profile === 'quick') &&
      state.approvals?.spec?.status !== 'approved') {
    errors.push(`${label} ${state.phase} requires approved spec`);
  }
  if (hasSolutionWorkflow && validPhase && POST_SOLUTION_APPROVAL_PHASES.has(state.phase) &&
      state.profile !== 'quick' && state.approvals?.solution?.status !== 'approved') {
    errors.push(`${label} ${state.phase} requires approved solution`);
  }

  if (state.phase === 'FINAL REPORT' && ['BUILD', 'VERIFY'].includes(state.lastCompletedPhase) &&
      state.terminalState !== 'IMPLEMENTATION BLOCKED') {
    errors.push(`${label} FINAL REPORT after ${state.lastCompletedPhase} requires IMPLEMENTATION BLOCKED`);
  }
  if (state.phase === 'FINAL REPORT' && ['REVIEW', 'RE-REVIEW'].includes(state.lastCompletedPhase) &&
      state.terminalState !== 'REVIEW BLOCKED') {
    errors.push(`${label} FINAL REPORT directly after review requires REVIEW BLOCKED`);
  }
  if (state.phase === 'FINAL REPORT' && state.lastCompletedPhase === 'LEARNING RETROSPECTIVE' &&
      state.terminalState !== 'REVIEW PASSED') {
    errors.push(`${label} FINAL REPORT after LEARNING RETROSPECTIVE requires REVIEW PASSED`);
  }
  if (state.phase === 'AUTO-REMEDIATE' &&
      Number.isInteger(state.reviewRemediationCycle) && state.reviewRemediationCycle >= 3) {
    errors.push(`${label} AUTO-REMEDIATE cannot begin after three review remediation cycles`);
  }
  validateObservedGitBaseline(state.gitBaseline, context.currentGitBaseline, label, errors);
  return errors;
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateStringArray(value, field, label, errors) {
  if (!Array.isArray(value)) {
    if (value !== undefined) errors.push(`${label} ${field} must be an array`);
    return;
  }
  if (value.some((entry) => !nonEmptyString(entry))) {
    errors.push(`${label} ${field} must contain only non-empty strings`);
  }
}

function validateArtifactRoot(state, label, errors) {
  if (!Object.hasOwn(state, 'artifactRoot')) return;
  if (!nonEmptyString(state.artifactRoot) || !isSafeProjectRelativePath(state.artifactRoot)) {
    errors.push(`${label} artifactRoot must be a safe project-relative path`);
    return;
  }
  if (!nonEmptyString(state.changeId)) return;

  const normalized = state.artifactRoot.replaceAll('\\', '/').replace(/\/$/, '');
  const expected = `.codex/workflows/changes/${state.changeId}`;
  const override = state.artifactRootOverride;
  if (override !== undefined && override !== null &&
      (!isPlainObject(override) || override.approved !== true || !nonEmptyString(override.reference))) {
    errors.push(`${label} artifactRootOverride must be null or contain approved: true and a reference`);
  }
  if (normalized === expected) return;

  if (!isPlainObject(override) || override.approved !== true || !nonEmptyString(override.reference)) {
    errors.push(`${label} artifactRoot must be ${expected} unless an approved override reference is recorded`);
  }
  if (normalized.split('/').at(-1) !== state.changeId) {
    errors.push(`${label} approved artifactRoot override must end with changeId ${state.changeId}`);
  }
}

function isSafeProjectRelativePath(value) {
  const normalized = value.trim().replaceAll('\\', '/');
  if (path.posix.isAbsolute(normalized) || path.win32.isAbsolute(value.trim()) ||
      /^[a-zA-Z]:/.test(normalized) || normalized.startsWith('//')) return false;
  const segments = normalized.split('/');
  return segments.length > 0 && segments.every((segment) => segment && segment !== '.' && segment !== '..');
}

function validateTriage(triage, profile, label, errors) {
  if (!isPlainObject(triage)) {
    if (triage !== undefined) errors.push(`${label} triage must be an object`);
    return;
  }
  validateStringArray(triage.highestFactors, 'triage.highestFactors', label, errors);
  validateStringArray(triage.escalationTriggers, 'triage.escalationTriggers', label, errors);
  if (!nonEmptyString(triage.reason)) errors.push(`${label} triage.reason must be a non-empty string`);
  if (!nonEmptyString(triage.solutionReason)) {
    errors.push(`${label} triage.solutionReason must be a non-empty string`);
  }
  const expectedMode = profile === 'quick' ? 'none' : profile === 'standard' ? 'lite' : profile === 'deep' ? 'full' : null;
  if (!['none', 'lite', 'full'].includes(triage.solutionMode)) {
    errors.push(`${label} triage.solutionMode must be none, lite, or full`);
  } else if (expectedMode && triage.solutionMode !== expectedMode) {
    errors.push(`${label} ${profile} profile requires triage.solutionMode ${expectedMode}`);
  }
  if (Array.isArray(triage.highestFactors) && triage.highestFactors.length === 0) {
    errors.push(`${label} triage.highestFactors must record at least one evidence-backed factor`);
  }
}

function validateApprovals(
  approvals,
  planApprovalRequired,
  solutionApprovalRequired,
  profile,
  requireArtifactBinding,
  label,
  errors,
) {
  if (!isPlainObject(approvals)) {
    if (approvals !== undefined) errors.push(`${label} approvals must be an object`);
    return;
  }
  const gates = profile === null ? ['spec', 'plan'] : ['spec', 'solution', 'plan'];
  for (const gate of gates) {
    const approval = approvals[gate];
    if (!isPlainObject(approval)) {
      errors.push(`${label} approvals.${gate} must be an object`);
      continue;
    }
    if (!['pending', 'approved'].includes(approval.status)) {
      errors.push(`${label} approvals.${gate}.status must be pending or approved`);
    }
    if (approval.reference !== null && typeof approval.reference !== 'string') {
      errors.push(`${label} approvals.${gate}.reference must be null or a string`);
    }
    if (approval.status === 'approved' && !nonEmptyString(approval.reference)) {
      errors.push(`${label} approved ${gate} requires a reference`);
    }
    if (requireArtifactBinding) validateApprovalBinding(approval, gate, label, errors);
  }
  if (profile !== null && isPlainObject(approvals.solution)) {
    if (typeof approvals.solution.required !== 'boolean') {
      errors.push(`${label} approvals.solution.required must be boolean`);
    } else if (approvals.solution.required !== solutionApprovalRequired) {
      errors.push(`${label} solution approval requirement does not match the selected profile`);
    }
    const expectedMode = profile === 'quick' ? 'none' : profile === 'standard' ? 'lite' : 'full';
    if (approvals.solution.mode !== expectedMode) {
      errors.push(`${label} approvals.solution.mode must be ${expectedMode} for ${profile}`);
    }
    if (!solutionApprovalRequired && approvals.solution.status === 'approved') {
      errors.push(`${label} Quick must escalate instead of approving a solution under the Quick profile`);
    }
  }
  if (isPlainObject(approvals.plan)) {
    if (typeof approvals.plan.required !== 'boolean') {
      errors.push(`${label} approvals.plan.required must be boolean`);
    } else if (planApprovalRequired === true && approvals.plan.required !== true) {
      errors.push(`${label} plan approval requirement must be true for the selected profile and risk`);
    }
  }
}

function validateSchema3Integrity(state, label, errors) {
  if (!Number.isInteger(state.revision) || state.revision < 0) {
    errors.push(`${label} revision must be a non-negative integer`);
  }
  if (!Number.isInteger(state.lastEventSequence) || state.lastEventSequence < 0) {
    errors.push(`${label} lastEventSequence must be a non-negative integer`);
    return;
  }
  if (state.lastEventSequence === 0) {
    if (state.lastEventHash !== null) {
      errors.push(`${label} lastEventHash must be null when lastEventSequence is 0`);
    }
    return;
  }
  if (typeof state.lastEventHash !== 'string' || !SHA256_DIGEST_PATTERN.test(state.lastEventHash)) {
    errors.push(`${label} lastEventHash must match sha256:<64-lowercase-hex> when events exist`);
  }
}

function validateApprovalBinding(approval, gate, label, errors) {
  const fields = ['artifactPath', 'digestAlgorithm', 'artifactDigest', 'approvedAt'];
  if (approval.status === 'pending') {
    if (fields.some((field) => approval[field] !== null)) {
      errors.push(`${label} pending ${gate} approval binding fields must be null`);
    }
    return;
  }
  if (approval.status !== 'approved') return;

  if (approval.artifactPath !== APPROVAL_ARTIFACTS[gate]) {
    errors.push(`${label} approvals.${gate}.artifactPath must be ${APPROVAL_ARTIFACTS[gate]}`);
  }
  if (approval.digestAlgorithm !== 'sha256-text-v1') {
    errors.push(`${label} approvals.${gate}.digestAlgorithm must be sha256-text-v1`);
  }
  if (typeof approval.artifactDigest !== 'string' || !SHA256_DIGEST_PATTERN.test(approval.artifactDigest)) {
    errors.push(`${label} approvals.${gate}.artifactDigest must match sha256:<64-lowercase-hex>`);
  }
  if (!isIsoDateTime(approval.approvedAt)) {
    errors.push(`${label} approvals.${gate}.approvedAt must be an ISO timestamp`);
  }
}

function validateBlockers(blockers, label, errors) {
  if (!isPlainObject(blockers)) {
    if (blockers !== undefined) errors.push(`${label} blockers must be an object`);
    return;
  }
  for (const [blockerId, blocker] of Object.entries(blockers)) {
    if (!nonEmptyString(blockerId) || !isPlainObject(blocker) || !Array.isArray(blocker.attempts)) {
      errors.push(`${label} blocker ${blockerId || '<empty>'} requires an attempts array`);
      continue;
    }
    if (blocker.attempts.length > 3) {
      errors.push(`${label} blocker ${blockerId} exceeds recovery attempt limit`);
    }
    const hypotheses = [];
    for (const [index, attempt] of blocker.attempts.entries()) {
      if (!isPlainObject(attempt) || !nonEmptyString(attempt.hypothesis)) {
        errors.push(`${label} blocker ${blockerId} attempt ${index + 1} requires a hypothesis`);
      } else {
        hypotheses.push(attempt.hypothesis.trim().toLowerCase());
      }
      if (!isPlainObject(attempt) || attempt.number !== index + 1) {
        errors.push(`${label} blocker ${blockerId} attempt ${index + 1} number must be ${index + 1}`);
      }
    }
    if (new Set(hypotheses).size !== hypotheses.length) {
      errors.push(`${label} blocker ${blockerId} recovery hypotheses must be distinct`);
    }
  }
}

function validateGitBaseline(baseline, label, errors) {
  if (!isPlainObject(baseline)) {
    if (baseline !== undefined) errors.push(`${label} gitBaseline must be an object`);
    return;
  }
  for (const field of ['head', 'statusFingerprint', 'recordedAt']) {
    if (!Object.hasOwn(baseline, field)) {
      errors.push(`${label} gitBaseline missing required field: ${field}`);
    } else if (baseline[field] !== null && !nonEmptyString(baseline[field])) {
      errors.push(`${label} gitBaseline.${field} must be null or a non-empty string`);
    }
  }
  if (baseline.recordedAt !== null && nonEmptyString(baseline.recordedAt) && !isIsoTimestamp(baseline.recordedAt)) {
    errors.push(`${label} gitBaseline.recordedAt must be an ISO timestamp string`);
  }
}

function isIsoTimestamp(value) {
  return nonEmptyString(value) && !Number.isNaN(Date.parse(value));
}

function isIsoDateTime(value) {
  return nonEmptyString(value) &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
    !Number.isNaN(Date.parse(value));
}

function isRecordedGitBaseline(baseline) {
  return isPlainObject(baseline) && nonEmptyString(baseline.head) &&
    nonEmptyString(baseline.statusFingerprint) && nonEmptyString(baseline.recordedAt);
}

function validateObservedGitBaseline(recorded, current, label, errors) {
  if (!isPlainObject(current) || !isRecordedGitBaseline(recorded)) return;
  if (!nonEmptyString(current.head) || !nonEmptyString(current.statusFingerprint)) {
    errors.push(`${label} currentGitBaseline requires head and statusFingerprint`);
    return;
  }
  if (recorded.head !== current.head || recorded.statusFingerprint !== current.statusFingerprint) {
    errors.push(`${label} gitBaseline drift must be reconciled before resume`);
  }
}

function formatChoices(values) {
  return values.map((value) => value === null ? 'no completed phase' : value).join(' or ');
}

function validateStateExamples(root, errors) {
  const validStatePath = path.join(root, 'evals', 'fixtures', 'workflow-state', 'valid-state.json');
  if (!requiredFile(validStatePath, errors)) return;
  const state = readJson(validStatePath, errors);
  if (!state) return;
  errors.push(...validateWorkflowState(state, 'valid-state.json'));

  const invalidStatePath = path.join(root, 'evals', 'fixtures', 'workflow-state', 'invalid-state.json');
  if (!requiredFile(invalidStatePath, errors)) return;
  const invalidState = readJson(invalidStatePath, errors);
  if (!invalidState) return;
  const expectedErrors = validateWorkflowState(invalidState, 'invalid-state.json');
  if (!expectedErrors.some((error) => error.includes('requires approved spec')) ||
      !expectedErrors.some((error) => error.includes('requires approved plan'))) {
    errors.push('invalid-state.json must demonstrate approval-gate rejection');
  }

  const remediationStatePath = path.join(root, 'evals', 'fixtures', 'workflow-state', 'remediation-state.json');
  if (!requiredFile(remediationStatePath, errors)) return;
  const remediationState = readJson(remediationStatePath, errors);
  if (remediationState) {
    errors.push(...validateWorkflowState(remediationState, 'remediation-state.json'));
  }

  const retrospectiveStatePath = path.join(root, 'evals', 'fixtures', 'workflow-state', 'learning-retrospective-state.json');
  if (!requiredFile(retrospectiveStatePath, errors)) return;
  const retrospectiveState = readJson(retrospectiveStatePath, errors);
  if (retrospectiveState) errors.push(...validateWorkflowState(retrospectiveState, 'learning-retrospective-state.json'));

  for (const fixture of ['blocker-limit-state.json', 'remediation-limit-state.json']) {
    const fixturePath = path.join(root, 'evals', 'fixtures', 'workflow-state', fixture);
    if (!requiredFile(fixturePath, errors)) continue;
    const fixtureState = readJson(fixturePath, errors);
    if (fixtureState) errors.push(...validateWorkflowState(fixtureState, fixture));
  }
}

function validateForbiddenStructure(root, errors) {
  for (const optionalPath of ['agents', 'hooks', '.mcp.json', '.app.json']) {
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
  const root = path.resolve(process.argv[2] ?? path.join(scriptDirectory, '..'));
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
