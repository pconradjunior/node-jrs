'use strict';

const fs = require('fs');
const yaml = require('js-yaml');
const { mergeDefaults } = require('./config-defaults');

class ConfigLoadError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'ConfigLoadError';
    this.cause = cause;
  }
}

function normalizeUrlSkip(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => {
    if (typeof entry === 'string') {
      return { path: entry, method: '*' };
    }
    if (entry && typeof entry === 'object') {
      const keys = Object.keys(entry);
      const path = keys[0];
      const method = entry[path] && entry[path].method ? entry[path].method : '*';
      return { path, method };
    }
    return null;
  }).filter(Boolean);
}

function normalizeAuthFields(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => {
    if (entry && typeof entry === 'object') {
      const name = Object.keys(entry)[0];
      const type = entry[name] && entry[name].type ? entry[name].type : 'string';
      return { name, type };
    }
    return null;
  }).filter(Boolean);
}

function loadConfig(configPath) {
  if (!fs.existsSync(configPath)) {
    throw new ConfigLoadError(
      'config.yaml not found. Run "json-rest-server create" to generate the initial structure.'
    );
  }

  let raw;
  try {
    const content = fs.readFileSync(configPath, 'utf8');
    raw = yaml.load(content) || {};
  } catch (err) {
    throw new ConfigLoadError(
      `Failed to parse config.yaml: ${err.message}`,
      err
    );
  }

  if (raw.auth) {
    raw.auth.urlSkip = normalizeUrlSkip(raw.auth.urlSkip);
    raw.auth.urlUserPermission = Array.isArray(raw.auth.urlUserPermission)
      ? raw.auth.urlUserPermission
      : [];
    raw.auth.authFields = normalizeAuthFields(raw.auth.authFields);
  }

  if (raw.broadcastProvider && typeof raw.broadcastProvider === 'string') {
    raw.broadcastProvider = raw.broadcastProvider
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
  }

  const config = mergeDefaults(raw);
  return config;
}

module.exports = { loadConfig, ConfigLoadError, normalizeUrlSkip, normalizeAuthFields };