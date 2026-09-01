'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { generateId, ConflictIdError } = require('../src/db/id-generator');

test('generateId int increments from last id', () => {
  const id = generateId([{ id: 5 }, { id: 6 }], 'int');
  assert.strictEqual(id, 7);
});

test('generateId int starts at 1 for empty table', () => {
  assert.strictEqual(generateId([], 'int'), 1);
});

test('generateId uuid returns string', () => {
  const id = generateId([], 'uuid');
  assert.strictEqual(typeof id, 'string');
  assert.ok(id.length > 0);
});

test('generateId uuid rejects if table has integer ids', () => {
  assert.throws(
    () => generateId([{ id: 1 }], 'uuid'),
    (err) => err instanceof ConflictIdError
  );
});

test('generateId int rejects if table has string ids', () => {
  assert.throws(
    () => generateId([{ id: 'abc' }], 'int'),
    (err) => err instanceof ConflictIdError
  );
});