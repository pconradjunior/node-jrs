'use strict';

const fs = require('fs');
const path = require('path');

class Persistence {
  constructor({ filePath, debounceMs = 500, logger = null, getSerialized = null }) {
    this.filePath = filePath;
    this.debounceMs = debounceMs;
    this.logger = logger;
    this.getSerialized = getSerialized || this._getSerialized;
    this.timer = null;
    this.pending = false;
    this.closed = false;
  }

  _getSerialized() {
    throw new Error('getSerialized must be provided or overridden');
  }

  flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.pending = true;
    this.timer = setTimeout(() => this.writeToDisk(), this.debounceMs);
  }

  writeToDisk() {
    this.timer = null;
    if (!this.pending) return;
    this.pending = false;

    const dir = path.dirname(this.filePath);
    const tmpPath = `${this.filePath}.tmp`;
    const data = this.getSerialized();

    if (this.logger) {
      this.logger.debug(`Persisting database to ${this.filePath}`);
    }

    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(tmpPath, data, 'utf8');
      fs.renameSync(tmpPath, this.filePath);
    } catch (err) {
      this.pending = true;
      if (this.logger) {
        this.logger.error(`Failed to persist database: ${err.message}`);
      }
    }
  }

  forceFlush() {
    this.closed = true;
    if (this.timer) clearTimeout(this.timer);
    if (this.pending) {
      this.writeToDisk();
    }
  }
}

module.exports = { Persistence };