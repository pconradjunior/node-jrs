'use strict';

const path = require('path');
const { loadConfig, ConfigLoadError } = require('../config/config-loader');
const { applyEnvOverrides } = require('../config/env');
const { resolveBaseDir, buildPaths } = require('../util/paths');
const { JsonRestServer } = require('../server/json-rest-server');
const { DatabaseLoadError } = require('../db/database');
const { printAccessUrls } = require('../util/net');

async function runServer(targetDir) {
  const baseDir = targetDir ? path.resolve(process.cwd(), targetDir) : resolveBaseDir();
  const paths = buildPaths(baseDir);

  let config;
  try {
    config = loadConfig(paths.configPath);
  } catch (err) {
    if (err instanceof ConfigLoadError) {
      console.error(err.message);
    } else {
      console.error(`Failed to load configuration: ${err.message}`);
    }
    process.exit(1);
  }

  applyEnvOverrides(config);

  if (config.database && config.database !== 'database.json') {
    paths.databasePath = require('path').resolve(baseDir, config.database);
  }

  const server = new JsonRestServer(config, paths);

  let httpServer;
  try {
    httpServer = await server.start();
  } catch (err) {
    if (err instanceof DatabaseLoadError) {
      console.error(err.message);
    } else if (err && err.name === 'SocketPortError') {
      console.error(err.message);
    } else {
      console.error(`Failed to start server: ${err.message}`);
    }
    process.exit(1);
  }

  const address = httpServer.address();
  const port = typeof address === 'object' && address ? address.port : config.port;
  printAccessUrls(port, config.host);

  const shutdown = () => {
    server.close().then(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

module.exports = { runServer };