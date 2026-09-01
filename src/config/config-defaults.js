'use strict';

const DEFAULTS = {
  name: 'Json Rest Server',
  port: 8080,
  host: '',
  database: 'database.json',
  idType: 'int',
  enableSocket: false,
  socketPort: 0,
  broadcastProvider: ['socket'],
  storage: {
    folder: 'storage/',
  },
  auth: null,
  slack: null,
};

const AUTH_DEFAULTS = {
  jwtSecret: '',
  jwtExpire: 3600,
  unauthorizedStatusCode: 403,
  enableAdm: false,
  urlUserPermission: [],
  urlSkip: [],
  authFields: [],
};

function mergeDefaults(config) {
  const merged = { ...DEFAULTS, ...(config || {}) };
  merged.storage = { ...DEFAULTS.storage, ...(merged.storage || {}) };
  if (merged.auth) {
    merged.auth = { ...AUTH_DEFAULTS, ...merged.auth };
    if (!Array.isArray(merged.auth.urlSkip)) merged.auth.urlSkip = [];
    if (!Array.isArray(merged.auth.urlUserPermission)) {
      merged.auth.urlUserPermission = [];
    }
    if (!Array.isArray(merged.auth.authFields)) merged.auth.authFields = [];
  }
  return merged;
}

module.exports = { DEFAULTS, AUTH_DEFAULTS, mergeDefaults };