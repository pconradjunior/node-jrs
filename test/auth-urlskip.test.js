'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { matchesUrlSkip } = require('../src/middleware/auth');

function req(path, method) {
  return { path, method };
}

test('urlSkip exact path matches', () => {
  const skip = [{ path: '/users', method: 'post' }];
  assert.strictEqual(matchesUrlSkip(req('/users', 'post'), skip), true);
  assert.strictEqual(matchesUrlSkip(req('/users', 'get'), skip), false);
});

test('urlSkip method wildcard matches any', () => {
  const skip = [{ path: '/products', method: '*' }];
  assert.strictEqual(matchesUrlSkip(req('/products', 'get'), skip), true);
  assert.strictEqual(matchesUrlSkip(req('/products', 'delete'), skip), true);
});

test('urlSkip wildcard segment {*}', () => {
  const skip = [{ path: '/products/{*}', method: 'get' }];
  assert.strictEqual(matchesUrlSkip(req('/products/12', 'get'), skip), true);
  assert.strictEqual(
    matchesUrlSkip(req('/products/12/reviews', 'get'), skip),
    false
  );
});