'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { Persistence } = require('../src/db/persistence');

test('Persistence serializes with the provided getSerialized callback', async () => {
  const filePath = `${process.env.TEMP}//jrs-persist-test.json`;
  const data = { users: [{ id: 1, name: 'a' }] };

  const persistence = new Persistence({
    filePath,
    debounceMs: 10,
    getSerialized: () => JSON.stringify(data, null, 2),
  });

  persistence.flush();
  await new Promise((r) => setTimeout(r, 50));

  const fs = require('fs');
  const written = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  assert.deepStrictEqual(written, data);
  fs.rmSync(filePath, { force: true });
});

test('Persistence forceFlush writes synchronously', () => {
  const fs = require('fs');
  const filePath = `${process.env.TEMP}//jrs-persist-force.json`;
  const data = { a: 1 };

  const persistence = new Persistence({
    filePath,
    debounceMs: 10000,
    getSerialized: () => JSON.stringify(data),
  });

  persistence.flush();
  persistence.forceFlush();

  assert.deepStrictEqual(JSON.parse(fs.readFileSync(filePath, 'utf8')), data);
  fs.rmSync(filePath, { force: true });
});