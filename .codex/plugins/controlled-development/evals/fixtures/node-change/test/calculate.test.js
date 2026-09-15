'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { applyDiscount } = require('../src/calculate');

test('subtracts a valid discount from the subtotal', () => {
  assert.equal(applyDiscount(100, 25), 75);
});
