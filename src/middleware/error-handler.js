'use strict';

const { ConflictIdError } = require('../db/id-generator');
const { ResourceNotFoundError } = require('../db/database');
const logger = require('../util/logger');

function jsonReturn(extra = {}) {
  return {
    'Content-Type': 'application/json',
    ...extra,
  };
}

function sendRes(res, status, body, headers = {}) {
  res.set(jsonReturn(headers));
  return res.status(status).json(body);
}

function errorHandler(err, req, res, next) {
  if (err instanceof ConflictIdError) {
    logger.error(`ConflictIdError: ${err.message}`);
    return sendRes(res, err.statusCode || 409, { erro: err.message });
  }

  if (err instanceof ResourceNotFoundError) {
    logger.debug(`ResourceNotFoundError on ${req.method} ${req.originalUrl}`);
    return sendRes(res, 404, { erro: 'resource not found' });
  }

  if (err && err.type === 'entity.parse.failed') {
    return sendRes(res, 400, { error: 'invalid json body' });
  }

  if (err && err.status && err.status >= 400 && err.status < 500) {
    return sendRes(res, err.status, { error: err.message });
  }

  logger.error(`Internal server error on ${req.method} ${req.originalUrl}: ${err && err.stack}`);
  return sendRes(res, 500, { error: 'Internal server error' });
}

module.exports = { errorHandler, jsonReturn, sendRes };