import assert from 'node:assert/strict';
import test from 'node:test';

import '../src/validation/existing-validators.js';
import { validate } from '../src/validation/registry.js';

test('registered validators use the shared registry', () => {
  assert.equal(validate('non-empty', 'value'), true);
  assert.equal(validate('trimmed', ' value'), false);
  assert.equal(validate('short', 'value'), true);
});
