'use strict';

const express = require('express');
const { sendRes } = require('../../middleware/error-handler');
const { comparePassword, castByType } = require('../../auth/password');
const logger = require('../../util/logger');

function buildAuthRouter(ctx) {
  const { database, jwt, config } = ctx;
  const router = express.Router();

  function findUser(users, body, authFields) {
    if (!authFields || authFields.length === 0) {
      return (
        users.find(
          (u) =>
            u.email === body.email && comparePassword(u.password, body.password)
        ) || null
      );
    }

    for (const user of users) {
      let validatedFields = 0;
      let valid = true;
      for (const field of authFields) {
        if (!Object.prototype.hasOwnProperty.call(body, field.name)) {
          const err = new Error(
            `field ${field.name} not found in validation. Please check if you put this validation in config.yaml then remove it or send the correct fields to authenticate`
          );
          err.status = 500;
          throw err;
        }
        const dataAsType = castByType(body[field.name], field.type);
        if (user[field.name] == dataAsType) {
          validatedFields++;
        } else {
          valid = false;
          break;
        }
      }
      if (valid && validatedFields === authFields.length) {
        return user;
      }
    }
    return null;
  }

  // POST /auth
  router.post('/auth', (req, res) => {
    const body = req.body || {};
    const adminLogin = Boolean(body.admin);
    const users = database.getAll(adminLogin ? 'adm_users' : 'users');

    if (users.length === 0) {
      return sendRes(res, 500, { erro: 'user table not exists' });
    }

    let user;
    try {
      user = findUser(users, body, config.auth ? config.auth.authFields : []);
    } catch (err) {
      logger.error(err.message);
      return sendRes(res, err.status || 500, { error: err.message });
    }

    if (!user) {
      return sendRes(res, statusCode(config), {
        error: 'Forbidden Access',
      });
    }

    let token;
    let refreshToken;
    try {
      token = jwt.generateJWT(user.id, adminLogin);
      refreshToken = jwt.refreshToken(token);
    } catch (err) {
      logger.error(
        `Auth not configured on POST /auth: ${err && err.message}`
      );
      return sendRes(res, 500, {
        error:
          'Auth is not configured. Add an auth block with jwtSecret and jwtExpire to config.yaml (see "auth:" section).',
      });
    }

    return sendRes(res, 200, {
      access_token: token,
      refresh_token: refreshToken,
      type: 'Bearer',
    });
  });

  // PUT /auth/refresh
  router.put('/auth/refresh', (req, res) => {
    const body = req.body || {};
    const authHeader = req.headers.authorization || req.headers.Authorization || '';
    const parts = authHeader.trim().split(/\s+/);
    const accessToken = parts[0] === 'Bearer' ? parts[1] : '';

    const refreshToken = body.refresh_token || '';

    if (!accessToken || !refreshToken) {
      return sendRes(res, statusCode(config), { error: 'Invalid tokens' });
    }

    try {
      const accessClaims = jwt.getClaims(accessToken);
      jwt.validateRefresh(accessToken, refreshToken);

      const id = accessClaims.sub;
      const adm = Boolean(accessClaims.adm);

      const token = jwt.generateJWT(id, adm);
      const newRefreshToken = jwt.refreshToken(token);

      return sendRes(res, 200, {
        access_token: token,
        refresh_token: newRefreshToken,
        type: 'Bearer',
      });
    } catch (err) {
      logger.debug(`Refresh failed: ${err.message}`);
      if (err && err.name === 'NotBeforeError' && refreshToken) {
        return sendRes(res, statusCode(config), {
          error: 'refresh_token_not_yet_valid',
          error_description: 'The token cannot be used before the notBefore date',
        });
      }
      return sendRes(res, statusCode(config), {
        error: 'invalid_refresh_token',
        error_description: 'The refresh token is invalid',
      });
    }
  });

  return router;

  function statusCode(cfg) {
    return cfg.auth ? cfg.auth.unauthorizedStatusCode || 403 : 403;
  }
}

module.exports = { buildAuthRouter };