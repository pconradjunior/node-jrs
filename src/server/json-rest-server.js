'use strict';

const http = require('http');
const { buildApp } = require('./app');
const { DatabaseRepository } = require('../db/database');
const { JwtHelper } = require('../auth/jwt');
const { BroadcastController } = require('../broadcast/controller');
const { TcpServer } = require('../socket/tcp-server');
const { WsServer } = require('../socket/ws-server');
const { ensureDir } = require('../util/paths');
const logger = require('../util/logger');

class JsonRestServer {
  constructor(config, paths) {
    this.config = config;
    this.paths = paths;
    this.server = null;
    this.ctx = null;
  }

  _validatePorts() {
    if (
      this.config.enableSocket &&
      this.config.socketPort &&
      this.config.socketPort === this.config.port
    ) {
      const err = new Error('SocketPort can\'t be equals HTTP Port');
      err.name = 'SocketPortError';
      throw err;
    }
  }

  _buildContext() {
    const database = new DatabaseRepository(this.config, this.paths, logger);
    database.load();

    const jwt = new JwtHelper(this.config);
    const broadcast = new BroadcastController();

    return {
      config: this.config,
      paths: this.paths,
      database,
      jwt,
      broadcast,
    };
  }

  async _startSockets(ctx) {
    if (!this.config.enableSocket) return;

    const providers = Array.isArray(this.config.broadcastProvider)
      ? this.config.broadcastProvider
      : ['socket'];

    for (const providerName of providers) {
      if (providerName === 'socket' && this.config.socketPort) {
        const tcp = new TcpServer({
          port: this.config.socketPort,
          ip: this.config.host || '0.0.0.0',
        });
        await tcp.start();
        ctx.broadcast.registerProvider('socket', tcp);
        logger.info(`socket provider (TCP) listening on :${this.config.socketPort}`);
      }

      if (providerName === 'websocket' && this.server) {
        const ws = new WsServer(this.server);
        ws.start();
        ctx.broadcast.registerProvider('websocket', ws);
        logger.info('websocket provider attached to HTTP server');
      }
    }
  }

  async start(port, host) {
    this._validatePorts();

    if (this.config.storage && this.config.storage.folder) {
      const folder = this.config.storage.folder.replace(/\/$/, '');
      ensureDir(folder);
    }

    this.ctx = this._buildContext();
    const app = buildApp(this.ctx);

    return new Promise((resolve, reject) => {
      this.server = http.createServer(app);

      const listenHost = host || this.config.host || '0.0.0.0';
      const listenPort = port || this.config.port;

      this.server.once('error', reject);

      this.server.listen(listenPort, listenHost, async () => {
        try {
          await this._startSockets(this.ctx);
          logger.info(
            `Json Rest Server started on ${listenHost}:${listenPort}`
          );
          resolve(this.server);
        } catch (err) {
          this.server.close();
          reject(err);
        }
      });
    });
  }

  async close() {
    if (this.ctx && this.ctx.broadcast) {
      this.ctx.broadcast.close();
    }
    if (this.ctx && this.ctx.database) {
      this.ctx.database.flush();
    }
    if (this.server) {
      await new Promise((resolve) => this.server.close(resolve));
      this.server = null;
    }
  }
}

module.exports = { JsonRestServer };