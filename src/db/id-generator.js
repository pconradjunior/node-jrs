'use strict';

const { v1: uuidv1 } = require('uuid');

class ConflictIdError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConflictIdError';
  }
}

function generateId(tableData, idType) {
  if (idType === 'uuid') {
    const hasIntegerValue = tableData.some((row) => typeof row.id === 'number');
    if (hasIntegerValue) {
      throw new ConflictIdError(
        'Your id pattern not UUID String value. Please ensure that you didn\'t change idType in the middle of your operation'
      );
    }
    return uuidv1();
  }

  const hasStringValue = tableData.some((row) => typeof row.id === 'string');
  if (hasStringValue) {
    throw new ConflictIdError(
      'Your id pattern not integer value. Please ensure that you didn\'t change idType in the middle of your operation'
    );
  }

  let lastId = 0;
  if (tableData.length > 0) {
    lastId = typeof tableData[tableData.length - 1].id === 'number'
      ? tableData[tableData.length - 1].id
      : 0;
  }
  return lastId + 1;
}

module.exports = { generateId, ConflictIdError };