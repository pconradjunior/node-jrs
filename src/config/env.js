'use strict';

function applyEnvOverrides(config) {
  if (process.env.PORT) {
    const port = Number(process.env.PORT);
    if (Number.isInteger(port) && port > 0 && port < 65536) {
      config.port = port;
    }
  }

  if (process.env.HOST) {
    config.host = process.env.HOST;
  }

  if (process.env.DATABASE_PATH) {
    config.database = process.env.DATABASE_PATH;
  }

  if (process.env.JWT_SECRET && config.auth) {
    config.auth.jwtSecret = process.env.JWT_SECRET;
  }

  return config;
}

module.exports = { applyEnvOverrides };