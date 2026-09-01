'use strict';

const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

function corsMiddleware(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', ALLOWED_METHODS.join(','));
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Authorization, Content-Type, socket-channel'
  );
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  return next();
}

module.exports = { corsMiddleware, ALLOWED_METHODS };