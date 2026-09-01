'use strict';

const jwt = require('jsonwebtoken');

const ISSUER = 'json_rest_server';
const REFRESH_EXPIRY_DAYS = 7;

class JwtConfigError extends Error {
  constructor() {
    super('Auth config not found check config.yaml');
    this.name = 'JwtConfigError';
  }
}

class JwtHelper {
  constructor(config) {
    this.config = config;
  }

  _auth() {
    const auth = this.config.auth;
    if (!auth || !auth.jwtSecret || !auth.jwtExpire) {
      throw new JwtConfigError();
    }
    return auth;
  }

  generateJWT(userId, admin) {
    const auth = this._auth();
    return jwt.sign(
      { adm: Boolean(admin) },
      auth.jwtSecret,
      {
        algorithm: 'HS256',
        issuer: ISSUER,
        subject: String(userId),
        expiresIn: auth.jwtExpire,
        notBefore: 0,
      }
    );
  }

  refreshToken(accessToken) {
    const auth = this._auth();
    return jwt.sign(
      {},
      auth.jwtSecret,
      {
        algorithm: 'HS256',
        issuer: accessToken,
        subject: 'RefreshToken',
        expiresIn: REFRESH_EXPIRY_DAYS * 24 * 60 * 60,
        notBefore: auth.jwtExpire,
      }
    );
  }

  getClaims(token) {
    const auth = this._auth();
    return jwt.verify(token, auth.jwtSecret, {
      issuer: ISSUER,
      algorithms: ['HS256'],
    });
  }

  validateRefresh(accessToken, refreshToken) {
    const auth = this._auth();
    return jwt.verify(refreshToken, auth.jwtSecret, {
      issuer: accessToken,
      algorithms: ['HS256'],
    });
  }

  verify(token) {
    const auth = this._auth();
    return jwt.verify(token, auth.jwtSecret, {
      issuer: ISSUER,
      algorithms: ['HS256'],
    });
  }
}

module.exports = { JwtHelper, JwtConfigError, ISSUER, REFRESH_EXPIRY_DAYS };