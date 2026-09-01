'use strict';

let verbose = false;
let quiet = false;

function configure({ verbose: v = false, quiet: q = false } = {}) {
  verbose = Boolean(v);
  quiet = Boolean(q);
}

function info(...args) {
  if (quiet) return;
  console.log(...args);
}

function debug(...args) {
  if (!verbose || quiet) return;
  console.log('[debug]', ...args);
}

function warn(...args) {
  if (quiet) return;
  console.warn('[warn]', ...args);
}

function error(...args) {
  console.error('[error]', ...args);
}

function requestLog(req, status, durationMs) {
  if (!verbose || quiet) return;
  console.log(
    `[request] ${req.method} ${req.originalUrl} -> ${status} (${durationMs}ms)`
  );
}

module.exports = {
  configure,
  info,
  debug,
  warn,
  error,
  requestLog,
};