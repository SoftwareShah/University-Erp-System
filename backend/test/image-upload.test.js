const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const validateImageUpload = require('../middlewares/validateImageUpload');

const validate = req => new Promise(resolve => {
  validateImageUpload(req, {}, error => resolve(error));
});

test('image upload validation detects actual image content and corrects the extension', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'erp-image-test-'));
  const filePath = path.join(directory, 'random-upload.tmp');
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jxZsAAAAASUVORK5CYII=', 'base64');
  const req = { file: { path: filePath, filename: path.basename(filePath), mimetype: 'image/png' } };

  try {
    await fs.writeFile(filePath, png);
    const error = await validate(req);
    assert.equal(error, undefined);
    assert.match(req.file.filename, /\.png$/);
    assert.equal(req.file.mimetype, 'image/png');
    await fs.access(req.file.path);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test('image upload validation accepts common image signatures without trusting MIME or filename extension', async () => {
  const samples = [
    { filename: 'photo.jpeg', bytes: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00]), extension: '.jpg', mime: 'image/jpeg' },
    { filename: 'photo.upload', bytes: Buffer.from('GIF89a'), extension: '.gif', mime: 'image/gif' },
    { filename: 'photo', bytes: Buffer.from('RIFF\x24\x00\x00\x00WEBPVP8 '), extension: '.webp', mime: 'image/webp' },
    { filename: 'photo', bytes: Buffer.from([0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66, 0, 0, 0, 0, 0x61, 0x76, 0x69, 0x66]), extension: '.avif', mime: 'image/avif' },
    { filename: 'photo', bytes: Buffer.from([0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 0x36, 0, 0, 0]), extension: '.bmp', mime: 'image/bmp' },
    { filename: 'photo', bytes: Buffer.from([0x49, 0x49, 0x2a, 0x00]), extension: '.tif', mime: 'image/tiff' },
  ];
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'erp-image-test-'));

  try {
    for (const sample of samples) {
      const originalPath = path.join(directory, sample.filename);
      const req = {
        file: {
          path: originalPath,
          filename: sample.filename,
          mimetype: 'application/octet-stream',
        },
      };
      await fs.writeFile(originalPath, sample.bytes);
      const error = await validate(req);
      assert.equal(error, undefined, `${sample.mime} should be detected from its content`);
      assert.equal(req.file.mimetype, sample.mime);
      assert.ok(req.file.filename.endsWith(sample.extension));
      await fs.access(req.file.path);
    }
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test('image upload validation rejects spoofed content and removes the upload', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'erp-image-test-'));
  const filePath = path.join(directory, 'spoof.png');
  const req = { file: { path: filePath, filename: path.basename(filePath), mimetype: 'image/png' } };

  try {
    await fs.writeFile(filePath, 'this is not image data');
    const error = await validate(req);
    assert.equal(error?.statusCode, 400);
    await assert.rejects(fs.access(filePath));
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});
