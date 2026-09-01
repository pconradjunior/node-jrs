'use strict';

const path = require('path');
const fs = require('fs');
const express = require('express');
const { sendRes } = require('../../middleware/error-handler');

function buildStorageRouter(ctx) {
  const { config } = ctx;
  const router = express.Router();

  const storageFolder = (config.storage && config.storage.folder) || 'storage';
  const absFolder = path.resolve(storageFolder);

  router.get('/storage/*', (req, res) => {
    const requested = decodeURIComponent(req.params[0] || '');
    const filePath = path.resolve(absFolder, requested);

    if (!filePath.startsWith(absFolder + path.sep) && filePath !== absFolder) {
      return sendRes(res, 403, { erro: 'invalid path' });
    }

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      return sendRes(res, 404, { erro: 'resource not found' });
    }

    return res.sendFile(filePath);
  });

  return router;
}

module.exports = { buildStorageRouter };