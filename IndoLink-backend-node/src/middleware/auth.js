const createError = require('http-errors');
const User = require('../models/user.model');
const { verifyAccessToken } = require('../utils/jwt');

async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) throw createError(401, 'Authentication required');
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (!user) throw createError(401, 'Invalid token');
    req.user = user;
    next();
  } catch (err) { next(err); }
}

function requireRoles(...roles) {
  return function roleGuard(req, res, next) {
    if (!req.user) return next(createError(401, 'Authentication required'));
    if (!roles.includes(req.user.role)) return next(createError(403, 'Forbidden'));
    next();
  };
}

module.exports = { protect, requireRoles };


