'use strict';

const express = require('express');
const { corsMiddleware } = require('../middleware/cors');
const { mockDelay } = require('../middleware/mock-delay');
const { loggingMiddleware } = require('../middleware/logging');
const { errorHandler } = require('../middleware/error-handler');
const { buildAuthMiddleware } = require('../middleware/auth');
const { buildAuthRouter } = require('./routers/auth-router');
const { buildMeRouter } = require('./routers/me-router');
const { buildUploadRouter } = require('./routers/upload-router');
const { buildStorageRouter } = require('./routers/storage-router');
const { buildCrudRouter } = require('./routers/crud-router');

function buildApp(ctx) {
  const app = express();

  app.disable('x-powered-by');

  app.use(mockDelay);
  app.use(corsMiddleware);
  app.use(express.json({ limit: '100mb' }));
  app.use(loggingMiddleware);

  app.use(buildAuthMiddleware(ctx));
  app.use(buildAuthRouter(ctx));
  app.use(buildMeRouter(ctx));
  app.use(buildUploadRouter(ctx));
  app.use(buildStorageRouter(ctx));
  app.use(buildCrudRouter(ctx));

  app.use('/', (req, res) => {
    res.status(404).json({ erro: 'resource not found' });
  });

  app.use(errorHandler);

  return app;
}

module.exports = { buildApp };