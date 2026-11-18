const ApiError = require('./ApiError');

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
    const statusCode = err.type === 'entity.too.large' ? 413 : 400;
    const message = statusCode === 413 ? 'Request body is too large.' : 'Request body contains invalid JSON.';
    return res.status(statusCode).json({ success: false, message });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'Value';
    return res.status(409).json({ success: false, message: `${field} already exists.` });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: `Invalid ${err.path || 'request'} value.` });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, message: messages.join(', ') });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError')  return res.status(401).json({ success: false, message: 'Invalid token.' });
  if (err.name === 'TokenExpiredError')  return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });

  // Multer upload errors
  if (err.name === 'MulterError') {
    const messages = {
      LIMIT_FILE_SIZE: 'Image must be 10 MB or smaller.',
      LIMIT_FIELD_COUNT: 'The form contains too many fields.',
      LIMIT_PART_COUNT: 'The form contains too many fields or files.',
      LIMIT_UNEXPECTED_FILE: 'Unexpected upload field. Use the profile photo field.',
    };
    const message = messages[err.code] || 'Invalid image upload.';
    return res.status(400).json({ success: false, message });
  }

  // Our own ApiError
  if (err.isOperational && Number.isInteger(err.statusCode) && err.statusCode >= 400 && err.statusCode < 600) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }

  // Unknown / programming errors — don't leak details
  console.error('UNHANDLED ERROR:', err.stack || err);
  res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
};

module.exports = errorHandler;
