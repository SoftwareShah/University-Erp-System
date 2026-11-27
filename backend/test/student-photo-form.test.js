const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const express = require('express');
const errorHandler = require('../utils/errorHandler');

const uploadDirectory = fsSync.mkdtempSync(path.join(os.tmpdir(), 'erp-student-upload-test-'));
const previousUploadDirectory = process.env.UPLOAD_DIR;
process.env.UPLOAD_DIR = uploadDirectory;
const upload = require('../config/upload');
const validateImageUpload = require('../middlewares/validateImageUpload');
if (previousUploadDirectory === undefined) delete process.env.UPLOAD_DIR;
else process.env.UPLOAD_DIR = previousUploadDirectory;

test('student photo upload accepts the full registration form with more than 20 fields', async () => {
  const app = express();
  app.post('/students', upload.single('avatar'), validateImageUpload, async (req, res, next) => {
    try {
      const result = { filename: req.file.filename, mimetype: req.file.mimetype };
      await fs.unlink(req.file.path);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });
  app.use(errorHandler);

  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  const { port } = server.address();
  const form = new FormData();
  for (let index = 0; index < 26; index++) {
    form.append(`studentField${index}`, `value${index}`);
  }
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jxZsAAAAASUVORK5CYII=', 'base64');
  form.append('avatar', new Blob([png], { type: 'application/octet-stream' }), 'student-photo.png');

  try {
    const response = await fetch(`http://127.0.0.1:${port}/students`, { method: 'POST', body: form });
    const result = await response.json();
    assert.equal(response.status, 201, result.message);
    assert.equal(result.mimetype, 'image/png');
    assert.match(result.filename, /\.png$/);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    await fs.rm(uploadDirectory, { recursive: true, force: true });
  }
});
