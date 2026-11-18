const fs = require('fs');

const cleanupFailedUpload = (req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode < 400 || !req.file) return;

    fs.unlink(req.file.path, error => {
      if (error && error.code !== 'ENOENT') {
        console.error(`Failed to remove rejected upload ${req.file.path}: ${error.message}`);
      }
    });
  });
  next();
};

module.exports = cleanupFailedUpload;
