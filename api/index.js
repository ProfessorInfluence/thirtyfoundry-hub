'use strict';
// Vercel serverless entrypoint. The hub's HTTP handler already exports
// `(req, res)` in Node's http signature, so we re-export it and let
// vercel.json rewrite all routes here.
module.exports = require('../server').handler;
