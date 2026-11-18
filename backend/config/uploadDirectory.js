const path = require('path');

const uploadDirectory = process.env.UPLOAD_DIR?.trim()
  || path.join(__dirname, '../public/uploads');

module.exports = path.resolve(uploadDirectory);
