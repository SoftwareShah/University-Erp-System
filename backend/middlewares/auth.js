const jwt          = require('jsonwebtoken');
const User         = require('../models/User');
const ApiError     = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// ── Verify JWT and attach user to req ────────────────────────────────────────
exports.authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Access denied. No token provided.');
  }

  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id).select('-password');
  if (!user)           throw new ApiError(401, 'User no longer exists.');
  if (!user.isActive)  throw new ApiError(401, 'Your account has been deactivated. Contact admin.');

  req.user = user;
  next();
});

// ── Check role is allowed ────────────────────────────────────────────────────
exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to perform this action.'));
  }
  next();
};
