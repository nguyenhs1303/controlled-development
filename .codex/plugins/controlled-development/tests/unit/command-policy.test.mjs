import assert from 'node:assert/strict';
import test from 'node:test';

import { authorizeCommand } from '../../scripts/runtime/command-policy.mjs';
import { RULE_IDS } from '../../scripts/runtime/enforcement-rule-ids.mjs';

test('command policy permits read-only commands and exact grants', () => {
  assert.equal(authorizeCommand('git status --short', [], 'win32').ruleId, RULE_IDS.COMMAND_READ_ALLOWED);
  assert.equal(authorizeCommand('Get-Content file.txt', [], 'win32').ruleId, RULE_IDS.COMMAND_READ_ALLOWED);
  assert.equal(authorizeCommand('npm test', [{ command: 'npm test', platforms: ['win32', 'linux'] }], 'linux').ruleId, RULE_IDS.COMMAND_GRANTED);
});

test('command policy denies compound, platform-mismatched, and unknown commands', () => {
  assert.equal(authorizeCommand('git status; npm test', [], 'linux').ruleId, RULE_IDS.COMMAND_COMPOUND_DENY);
  assert.equal(authorizeCommand('npm test', [{ command: 'npm test', platforms: ['win32'] }], 'linux').ruleId, RULE_IDS.COMMAND_NOT_GRANTED);
  assert.equal(authorizeCommand('custom-tool --write', [], 'win32').ruleId, RULE_IDS.COMMAND_NOT_GRANTED);
});
