'use strict';

const path = require('path');
const fs = require('fs');

function resolveBaseDir() {
  return process.cwd();
}

function buildPaths(baseDir = resolveBaseDir(), overrides = {}) {
  const databaseFile = overrides.database || 'database.json';
  return {
    baseDir,
    configPath: path.resolve(baseDir, 'config.yaml'),
    databasePath: path.resolve(baseDir, databaseFile),
    databaseFile,
    storageFolder: overrides.storageFolder || path.resolve(baseDir, 'storage'),
  };
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

module.exports = {
  resolveBaseDir,
  buildPaths,
  ensureDir,
};