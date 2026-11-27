const fs = require('fs/promises');
const path = require('path');
const ApiError = require('../utils/ApiError');

const validateImageUpload = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const { fileTypeFromFile } = await import('file-type');
    const detectedType = await fileTypeFromFile(req.file.path);
    if (!detectedType?.mime.startsWith('image/')) {
      throw new ApiError(400, 'The uploaded file is not a supported image. Use a valid JPEG, PNG, GIF, WebP, AVIF, BMP, or TIFF image.');
    }

    const extension = path.extname(req.file.filename);
    const detectedFilename = `${path.basename(req.file.filename, extension)}.${detectedType.ext}`;
    const detectedPath = path.join(path.dirname(req.file.path), detectedFilename);
    if (detectedPath !== req.file.path) {
      await fs.rename(req.file.path, detectedPath);
      req.file.path = detectedPath;
      req.file.filename = detectedFilename;
    }
    req.file.mimetype = detectedType.mime;
    next();
  } catch (error) {
    try {
      await fs.unlink(req.file.path);
    } catch (cleanupError) {
      if (cleanupError.code !== 'ENOENT') {
        console.error(`Failed to remove invalid image upload ${req.file.path}: ${cleanupError.message}`);
      }
    }
    next(error);
  }
};

module.exports = validateImageUpload;
