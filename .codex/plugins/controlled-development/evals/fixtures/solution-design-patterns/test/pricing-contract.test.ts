import assert from 'node:assert/strict';
import test from 'node:test';

import { MemberPricing, StandardPricing } from '../src/pricing.js';

test('pricing strategies preserve the shared contract', () => {
  assert.equal(new StandardPricing().calculate(100), 100);
  assert.equal(new MemberPricing().calculate(100), 90);
});
