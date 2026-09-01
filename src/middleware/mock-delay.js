'use strict';

async function mockDelay(req, res, next) {
  const header = req.headers['mock-delay'];
  if (header) {
    const seconds = Number.parseInt(header, 10);
    const delay = Number.isNaN(seconds) || seconds < 0 ? 0 : seconds;
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay * 1000));
    }
  }
  next();
}

module.exports = { mockDelay };