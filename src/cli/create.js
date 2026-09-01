'use strict';

const fs = require('fs');
const path = require('path');
const { resolveBaseDir, ensureDir, buildPaths } = require('../util/paths');
const { configTemplate, databaseTemplate } = require('../db/templates');

function create(targetDir) {
  const baseDir = targetDir ? path.resolve(process.cwd(), targetDir) : resolveBaseDir();
  ensureDir(baseDir);

  const paths = buildPaths(baseDir);
  let createdCount = 0;

  if (!fs.existsSync(paths.configPath)) {
    fs.writeFileSync(paths.configPath, configTemplate, 'utf8');
    createdCount++;
  }

  if (!fs.existsSync(paths.databasePath)) {
    const dbContent = `${JSON.stringify(databaseTemplate, null, 2)}\n`;
    fs.writeFileSync(paths.databasePath, dbContent, 'utf8');
    createdCount++;
  }

  ensureDir(path.resolve(baseDir, 'storage'));

  if (createdCount === 0) {
    process.stdout.write(
      'Config files already exist. Nothing was overwritten.\n'
    );
  } else {
    process.stdout.write('Config generated successfully.\n');
  }
}

module.exports = { create };