'use strict';

const fs = require('fs');
const { Persistence } = require('./persistence');

class DatabaseLoadError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DatabaseLoadError';
  }
}

class ResourceNotFoundError extends Error {
  constructor() {
    super('resource not found');
    this.name = 'ResourceNotFoundError';
  }
}

class DatabaseRepository {
  constructor(config, paths, logger) {
    this.config = config;
    this.paths = paths;
    this.logger = logger;
    this.data = {};
    this.persistence = new Persistence({
      filePath: paths.databasePath,
      logger,
      getSerialized: () => JSON.stringify(this.data, null, 2),
    });
  }

  load() {
    const { databasePath } = this.paths;
    if (!fs.existsSync(databasePath)) {
      fs.writeFileSync(databasePath, '{}', 'utf8');
      this.data = {};
      return;
    }

    let content;
    try {
      content = fs.readFileSync(databasePath, 'utf8');
      this.data = JSON.parse(content);
    } catch (err) {
      throw new DatabaseLoadError(
        `database.json is invalid or unreadable: ${err.message}. The file was NOT overwritten.`
      );
    }

    if (typeof this.data !== 'object' || this.data === null || Array.isArray(this.data)) {
      throw new DatabaseLoadError(
        'database.json root must be an object of collections.'
      );
    }
  }

  tableExists(table) {
    return Object.prototype.hasOwnProperty.call(this.data, table);
  }

  getAll(table) {
    if (!this.tableExists(table)) return [];
    const rows = this.data[table];
    return Array.isArray(rows) ? rows : [];
  }

  getById(table, id) {
    return this.getAll(table).find((row) => row.id === id) || null;
  }

  save(table, data) {
    const id = data.id;
    let lineData = null;
    if (id != null) {
      lineData = this.getById(table, id);
    }

    let saveData;
    if (lineData) {
      saveData = { ...lineData, ...data };
      const index = this.data[table].findIndex((row) => row.id === id);
      this.data[table][index] = saveData;
    } else {
      const bodyData = { ...data };
      delete bodyData.id;
      const tableData = this.getAll(table);
      const newId = this.generateId(tableData);
      saveData = { id: newId, ...bodyData };
      if (!this.tableExists(table)) this.data[table] = [];
      this.data[table].push(saveData);
    }

    this.persistence.flush();
    return saveData;
  }

  update(table, data) {
    const id = data.id;
    if (id == null) {
      throw new ResourceNotFoundError();
    }
    const lineData = this.getById(table, id);
    if (!lineData) {
      throw new ResourceNotFoundError();
    }
    return this.save(table, data);
  }

  remove(table, id) {
    if (!this.tableExists(table)) return;
    const rows = this.data[table];
    const index = rows.findIndex((row) => row.id === id);
    if (index !== -1) {
      rows.splice(index, 1);
      this.persistence.flush();
    }
  }

  generateId(tableData) {
    const { generateId, ConflictIdError } = require('./id-generator');
    try {
      return generateId(tableData, this.config.idType);
    } catch (err) {
      if (err instanceof ConflictIdError) {
        err.statusCode = 409;
      }
      throw err;
    }
  }

  flush() {
    this.persistence.forceFlush();
  }
}

module.exports = { DatabaseRepository, DatabaseLoadError, ResourceNotFoundError };