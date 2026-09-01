'use strict';

const os = require('os');
const logger = require('./logger');

function getNetworkAddresses() {
  const results = [];
  const interfaces = os.networkInterfaces();
  Object.values(interfaces).forEach((list) => {
    (list || []).forEach((entry) => {
      if (entry.family === 'IPv4' && !entry.internal) {
        results.push(entry.address);
      }
    });
  });
  return results;
}

function printAccessUrls(port, host) {
  const addrs = getNetworkAddresses();
  const lines = [`Json Rest Server is running. Server ports open:`, `  Server started at ${new Date().toLocaleTimeString()}`];

  if (!host || host === '0.0.0.0' || host === '::') {
    lines.push(`  Local:  http://localhost:${port}`);
    addrs.forEach((ip) => lines.push(`  Network: http://${ip}:${port}`));
  } else {
    lines.push(`  Server: http://${host}:${port}`);
  }

  lines.forEach((line) => logger.info(line));
}

module.exports = { printAccessUrls, getNetworkAddresses };