const pool = require('../config/pool');

function dbMiddleware(req, res, next) {
    req.db = pool
    next();
}

module.exports = dbMiddleware;