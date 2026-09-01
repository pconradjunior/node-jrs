'use strict';

const { WebSocketServer } = require('ws');
const logger = require('../util/logger');

class WsServer {
  constructor(httpServer) {
    this.httpServer = httpServer;
    this.wss = null;
    this.clients = new Set();
  }

  start() {
    this.wss = new WebSocketServer({ noServer: true });
    this.wss.on('connection', (ws, request) => {
      const tables = request ? parseTablesFromUrl(request.url) : null;
      const client = { ws, tables };
      this.clients.add(client);
      ws.on('close', () => this.clients.delete(client));
      ws.on('error', (err) => {
        logger.debug(`[websocket] client error: ${err.message}`);
        this.clients.delete(client);
      });
    });

    this.httpServer.on('upgrade', (request, socket, head) => {
      this.wss.handleUpgrade(request, socket, head, (ws) => {
        this.wss.emit('connection', ws, request);
      });
    });
  }

  broadcast(payload) {
    if (this.clients.size === 0) return false;

    let sent = false;
    const message = JSON.stringify(payload);
    for (const client of this.clients) {
      if (client.ws.readyState !== 1) continue;
      if (client.tables && !client.tables.includes(payload.table)) continue;
      client.ws.send(message);
      sent = true;
    }
    return sent;
  }

  close() {
    for (const client of this.clients) {
      client.ws.close();
    }
    this.clients.clear();
  }

  get clientCount() {
    return this.clients.size;
  }
}

function parseTablesFromUrl(url) {
  try {
    const parsed = new URL(url, 'http://localhost');
    const tablesParam = parsed.searchParams.get('tables');
    if (!tablesParam) return null;
    return tablesParam.split(',').map((t) => t.trim()).filter(Boolean);
  } catch {
    return null;
  }
}

module.exports = { WsServer };