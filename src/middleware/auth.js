'use strict';

const { sendRes } = require('./error-handler');
const logger = require('../util/logger');

function matchesUrlSkip(request, skipUrls) {
  if (!Array.isArray(skipUrls)) return false;

  const pathUrl = request.path.split('?')[0];
  const method = request.method.toLowerCase();

  return skipUrls.some((entry) => {
    const entryPath = entry.path || '';
    const entryMethod = (entry.method || '*').toLowerCase();

    if (entryMethod !== '*' && entryMethod !== method) return false;

    if (entryPath.includes('{*}')) {
      const segPattern = entryPath.split('/').filter(Boolean);
      const segPath = pathUrl.split('/').filter(Boolean);
      if (segPattern.length !== segPath.length) return false;
      for (let i = 0; i < segPath.length; i++) {
        if (segPattern[i] === '{*}') continue;
        if (segPattern[i] !== segPath[i]) return false;
      }
      return true;
    }

    return entryPath === pathUrl;
  });
}

function buildAuthMiddleware(ctx) {
  const { config, jwt, database } = ctx;

  return function authMiddleware(req, res, next) {
    if (req.method === 'OPTIONS') return next();
    if (req.path === '/' || req.path === '') return next();

    const segments = req.path.split('/').filter(Boolean);

    // POST /auth, PUT /auth/refresh are handled by their own router
    if (segments[segments.length - 1] === 'auth') return next();
    if (
      req.method === 'PUT' &&
      segments[segments.length - 2] === 'auth' &&
      segments[segments.length - 1] === 'refresh'
    ) {
      return next();
    }

    if (!config.auth) return next();

    if (segments[0] === 'storage') return next();

    if (matchesUrlSkip(req, config.auth.urlSkip)) return next();

    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || authHeader.trim() === '') {
      return unauthorized(res, req, config);
    }

    const parts = authHeader.trim().split(/\s+/);
    if (parts[0] !== 'Bearer' || !parts[1]) {
      return unauthorized(res, req, config);
    }

    let claims;
    try {
      claims = jwt.verify(parts[1]);
    } catch (err) {
      logger.debug(`Auth rejected: ${err.message}`);
      return unauthorized(res, req, config);
    }

    const userId = claims.sub;
    if (userId == null) {
      return unauthorized(res, req, config);
    }

    const adm = Boolean(claims.adm);

    // Write methods restricted to admins when enableAdm is on
    const writeMethods = ['post', 'put', 'delete'];
    if (writeMethods.includes(req.method.toLowerCase())) {
      const pathUrl = req.path.split('?')[0];
      if (config.auth.enableAdm) {
        const allowed =
          adm || (config.auth.urlUserPermission || []).includes(pathUrl);
        if (!allowed) {
          logger.debug(`Auth rejected: not admin for ${req.method} ${pathUrl}`);
          return unauthorized(res, req, config);
        }
      }
    }

    req.user = userId;
    req.adm = adm;
    req.accessToken = parts[1];

    return next();
  };
}

function unauthorized(res, req, config) {
  const status = config.auth
    ? config.auth.unauthorizedStatusCode || 403
    : 403;
  return sendRes(res, status, { error: 'Unauthorized' });
}

module.exports = { buildAuthMiddleware, matchesUrlSkip };