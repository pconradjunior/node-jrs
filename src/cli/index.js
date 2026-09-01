'use strict';

const { Command } = require('commander');

const packageJson = require('../../package.json');
const logger = require('../util/logger');

function run(argv) {
  const program = new Command();

  program
    .name('json-rest-server')
    .description('RESTful server based on JSON for development and prototyping')
    .version(packageJson.version)
    .option('-d, --debug', 'enable debug logging');

  program
    .command('create')
    .description('Generate config.yaml, database.json and the storage folder')
    .argument('[dir]', 'target directory for the generated files (default: current)')
    .action((dir) => {
      logger.configure({ verbose: program.opts().debug });
      require('./create').create(dir);
    });

  program
    .command('run')
    .description('Start the server (default behavior)')
    .action(() => {
      logger.configure({ verbose: program.opts().debug });
      require('./run').runServer();
    });

  program.parse(argv);

  if (argv.slice(2).length === 0 || argv.slice(2).every((a) => a.startsWith('-'))) {
    logger.configure({ verbose: program.opts().debug });
    require('./run').runServer();
  }
}

module.exports = { run };