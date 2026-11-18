const multer = require('multer');
const fs = require('fs');
const path   = require('path');
const crypto = require('crypto');
const uploadDirectory = require('./uploadDirectory');

const profileDirectory = path.join(uploadDirectory, 'profiles');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdir(profileDirectory, { recursive: true }, err => {
      if (err) return cb(err);
      cb(null, profileDirectory);
    });
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const prefix = req.user ? `${req.user._id}_` : '';
    cb(null, `${prefix}${crypto.randomBytes(16).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
    fieldSize: 10 * 1024,
    fields: 40,
    files: 1,
    parts: 41,
  },
});

module.exports = upload;
