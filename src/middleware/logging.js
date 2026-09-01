'use strict';

const { requestLog } = require('../util/logger');

function loggingMiddleware(req, res, next) {
  const start = Date.now();
  const originalEnd = res.end.bind(res);
  res.end = (...args) => {
    const duration = Date.now() - start;
    requestLog(req, res.statusCode, duration);
    originalEnd(...args);
  };
  next();
}

module.exports = { loggingMiddleware };