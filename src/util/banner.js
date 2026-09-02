'use strict';

const packageJson = require('../../package.json');

const BANNER = `
     _   ____   ____  ___ ___   _         _        _
    / \\ / ___| / ___||_ _|_ _| / \\   _ __| |_     / \\   _ __ ___| |__ (_)_   _____
   / _ \\ \\___ \\| |    | | | |  / _ \\ | '__| __|   / _ \\ | '__/ __| '_ \\| \\ \\ / / _ \\
  / ___ \\ ___) | |___ | | | | / ___ \\| |  | |_   / ___ \\| | | (__| | | | |\\ V /  __/
 /_/   \\_\\____/ \\____|___|___/_/   \\_\\_|   \\__| /_/   \\_\\_|  \\___|_| |_|_| \\_/ \\___|
`;

function printBanner(config) {
  const lines = [BANNER];
  lines.push(`  json-rest-server v${packageJson.version}`);

  if (config) {
    if (config.name) {
      lines.push(`  Server: ${config.name}`);
    }
    const host = config.host || '0.0.0.0';
    const port = config.port || 8080;
    lines.push(`  Listening on http://${host}:${port}`);
  }

  lines.push('');
  process.stdout.write(lines.join('\n'));
}

module.exports = { printBanner };
