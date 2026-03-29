/*
  Multer yapilandirmasi — video yukleme islemleri icin
  Dosya boyutu, tip kontrolu ve benzersiz isimlendirme ayarlari burada
*/
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const config = require('./env');

// yuklenecek videolarin kaydedilecegi klasor
const uploadDir = path.join(__dirname, '../../uploads/videos');

// her dosyaya benzersiz isim ver — cakisma olmasin
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

// sadece video dosyalarina izin ver
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
    cb(new Error('Gecersiz dosya tipi. Sadece video dosyalari yuklenebilir (mp4, avi, mov, mkv, webm)'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSize // .env'den alinan limit, varsayilan 100MB
  }
});

module.exports = upload;
