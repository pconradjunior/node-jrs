'use strict';

const express = require('express');
const { sendRes } = require('../../middleware/error-handler');

function buildMeRouter(ctx) {
  const { database, config } = ctx;
  const router = express.Router();

  // GET /me
  router.get('/me', (req, res) => {
    if (!config.auth) {
      return sendRes(res, 404, {
        message: 'authentication not configured, please check documentation',
      });
    }

    const id = req.user;
    if (id == null || id === '') {
      return sendRes(res, 400, { error: 'param id required' });
    }

    const adm = Boolean(req.adm);
    const table = adm ? 'adm_users' : 'users';
    const idUser = config.idType === 'int' ? Number(id) : id;

    const result = database.getById(table, idUser);
    if (!result) {
      return sendRes(res, 200, {});
    }

    const safe = { ...result };
    delete safe.password;
    return sendRes(res, 200, safe);
  });

  return router;
}

module.exports = { buildMeRouter };