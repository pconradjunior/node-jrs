'use strict';

const net = require('net');
const logger = require('../util/logger');

class TcpServer {
  constructor({ port, ip = '0.0.0.0' }) {
    this.port = port;
    this.ip = ip;
    this.server = null;
    this.clients = new Set();
  }

  start() {
    return new Promise((resolve, reject) => {
      this.server = net.createServer((socket) => {
        logger.debug(`[socket] client connected: ${socket.remoteAddress}`);
        this.clients.add(socket);
        socket.on('close', () => this.clients.delete(socket));
        socket.on('error', (err) => {
          logger.debug(`[socket] client error: ${err.message}`);
          this.clients.delete(socket);
        });
      });

      this.server.once('error', reject);
      this.server.listen(this.port, this.ip, () => {
        logger.debug(`[socket] TCP server listening on ${this.ip}:${this.port}`);
        resolve(this);
      });
    });
  }

  broadcast(payload) {
    if (this.clients.size === 0) return false;
    const message = JSON.stringify(payload);
    for (const client of this.clients) {
      if (client.writable) {
        client.write(`${message}\n`);
      }
    }
    return true;
  }

  close() {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
    for (const client of this.clients) {
      client.destroy();
    }
    this.clients.clear();
  }

  get clientCount() {
    return this.clients.size;
  }
}

module.exports = { TcpServer };