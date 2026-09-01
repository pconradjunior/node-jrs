'use strict';

const express = require('express');
const { sendRes } = require('../../middleware/error-handler');

function buildCrudRouter(ctx) {
  const { database, broadcast, config } = ctx;
  const router = express.Router();

  function substituteUserRef(value, req) {
    if (value === '#userAuthRef') {
      return req.user || '0';
    }
    return value;
  }

  function substituteInObject(obj, req) {
    const result = {};
    Object.entries(obj).forEach(([key, value]) => {
      result[key] = substituteUserRef(value, req);
    });
    return result;
  }

  function applyFilters(rows, params, req) {
    let result = [...rows];
    Object.entries(params).forEach(([key, value]) => {
      const filterValue = substituteUserRef(value, req);
      result = result.filter((row) => {
        const field = row[key];
        if (field == null) return false;
        return String(field).toLowerCase().includes(String(filterValue).toLowerCase());
      });
    });
    return result;
  }

  // GET /:table
  router.get('/:table', (req, res) => {
    const { table } = req.params;
    if (!database.tableExists(table)) {
      return sendRes(res, 404, { erro: 'resource not found' });
    }

    let rows = database.getAll(table);

    if (Object.prototype.hasOwnProperty.call(req.query, 'page')) {
      const params = { ...req.query };
      delete params.page;
      delete params.limit;
      if (Object.keys(params).length > 0) {
        rows = applyFilters(rows, params, req);
      }

      const pageParam = Number.parseInt(req.query.page || '1', 10);
      const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
      const limitParam = Number.parseInt(req.query.limit || '10', 10);
      const limit = Number.isNaN(limitParam) || limitParam < 1 ? 10 : limitParam;

      const total = rows.length;
      const start = (page - 1) * limit;
      const data = rows.slice(start, start + limit);

      return sendRes(res, 200, {
        data,
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      });
    }

    if (Object.keys(req.query).length > 0) {
      rows = applyFilters(rows, req.query, req);
    }

    return sendRes(res, 200, rows);
  });

  // GET /:table/:id
  router.get('/:table/:id', (req, res) => {
    const { table, id } = req.params;
    if (!database.tableExists(table)) {
      return sendRes(res, 404, { erro: 'resource not found' });
    }
    const result = database.getById(table, parseId(id, config));
    return sendRes(res, 200, result || {});
  });

  // POST /:table
  router.post('/:table', (req, res) => {
    const { table } = req.params;
    if (!database.tableExists(table)) {
      return sendRes(res, 404, { erro: 'resource not found' });
    }
    if (!isPlainObject(req.body)) {
      return sendRes(res, 400, { error: 'invalid json body' });
    }
    const body = substituteInObject(req.body, req);
    const saved = database.save(table, body);
    broadcast.notifyWrite(req.method, table, saved, req);
    return sendRes(res, 200, saved);
  });

  function updateRecord(req, res) {
    const { table, id } = req.params;
    if (!database.tableExists(table)) {
      return sendRes(res, 404, { erro: 'resource not found' });
    }
    if (!isPlainObject(req.body)) {
      return sendRes(res, 400, { error: 'invalid json body' });
    }
    const body = { ...substituteInObject(req.body, req), id: parseId(id, config) };
    const updated = database.update(table, body);
    broadcast.notifyWrite(req.method, table, updated, req);
    return sendRes(res, 200, updated);
  }

  router.put('/:table/:id', updateRecord);
  router.patch('/:table/:id', updateRecord);

  // DELETE /:table/:id
  router.delete('/:table/:id', (req, res) => {
    const { table, id } = req.params;
    database.remove(table, parseId(id, config));
    broadcast.notifyWrite(req.method, table, {}, req);
    return sendRes(res, 200, {});
  });

  return router;
}

function parseId(rawId, config) {
  if (config.idType === 'int') {
    const parsed = Number.parseInt(rawId, 10);
    return Number.isNaN(parsed) ? rawId : parsed;
  }
  return rawId;
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

module.exports = { buildCrudRouter };