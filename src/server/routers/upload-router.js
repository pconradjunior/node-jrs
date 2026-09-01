'use strict';

const path = require('path');
const multer = require('multer');
const express = require('express');
const { sendRes } = require('../../middleware/error-handler');

function buildUploadRouter(ctx) {
  const { config } = ctx;
  const router = express.Router();

  const storageFolder = (config.storage && config.storage.folder) || 'storage';
  const absFolder = path.resolve(storageFolder);

  const upload = multer({
    storage: multer.diskStorage({
      destination(req, file, cb) {
        cb(null, absFolder);
      },
      filename(req, file, cb) {
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${name}${Date.now()}${ext}`);
      },
    }),
    limits: { fileSize: 200 * 1024 * 1024 },
  });

  // POST /uploads (multipart field "file")
  router.post('/uploads', upload.single('file'), (req, res) => {
    if (!req.file) {
      return sendRes(res, 400, { error: 'file not found in request' });
    }
    return sendRes(res, 200, { filename: req.file.filename });
  });

  return router;
}

module.exports = { buildUploadRouter };