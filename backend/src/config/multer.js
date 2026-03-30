/*
  Multer configuration — for video upload operations
  File size, type validation and unique naming settings are here
*/
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const config = require('./env');

// Directory where uploaded videos will be saved
const uploadDir = path.join(__dirname, '../../uploads/videos');

// Give each file a unique name — avoid collisions
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = crypto.randomUUID();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueId}${ext}`);
  }
});

// Only allow video files
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'video/mp4',
    'video/avi',
    'video/x-msvideo',
    'video/quicktime',
    'video/x-matroska',
    'video/webm',
    'video/ogg'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only video files can be uploaded (mp4, avi, mov, mkv, webm)'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSize // Limit from .env, default 100MB
  }
});

module.exports = upload;
