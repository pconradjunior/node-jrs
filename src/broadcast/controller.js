'use strict';

const logger = require('../util/logger');

const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

class BroadcastController {
  constructor() {
    this.providers = new Map();
  }

  registerProvider(name, provider) {
    this.providers.set(name, provider);
  }

  unregisterProvider(name) {
    this.providers.delete(name);
  }

  /**
   * Emits a broadcast event for write verbs (POST/PUT/PATCH/DELETE).
   * Channel defaults to the HTTP verb unless the request carries
   * a "socket-channel" header.
   */
  notifyWrite(method, table, data, req) {
    if (!WRITE_METHODS.includes(method)) return false;

    let channel = method;
    if (req && req.headers && req.headers['socket-channel']) {
      channel = req.headers['socket-channel'];
    }

    const payload = { channel, table, data };
    const providers = this._enabledProviders();

    let sent = false;
    for (const name of providers) {
      const provider = this.providers.get(name);
      if (!provider) continue;
      const ok = provider.broadcast(payload);
      if (ok) sent = true;
    }

    if (sent) {
      logger.debug(`[broadcast] ${channel} -> ${providers.join(',')}`);
    }
    return sent;
  }

  _enabledProviders() {
    return Array.from(this.providers.keys());
  }

  close() {
    for (const provider of this.providers.values()) {
      if (provider && typeof provider.close === 'function') {
        provider.close();
      }
    }
    this.providers.clear();
  }
}

module.exports = { BroadcastController };