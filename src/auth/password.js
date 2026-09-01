'use strict';

// Plaintext comparison for dev/test environments (product decision).
// This matches the original Dart behavior where passwords are stored
// as plaintext in database.json.

function comparePassword(stored, provided) {
  return stored === provided;
}

function castByType(value, type) {
  switch ((type || 'string').toLowerCase()) {
    case 'int':
      if (typeof value === 'number') return value;
      return Number.parseInt(value, 10);
    case 'double':
      if (typeof value === 'number') return value;
      return Number.parseFloat(value);
    case 'string':
    default:
      return String(value);
  }
}

module.exports = { comparePassword, castByType };