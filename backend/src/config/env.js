/*
  Ortam degiskenleri yapilandirmasi
  .env dosyasindan degiskenleri yukler ve
  uygulama genelinde kullanilacak config objesini olusturur
*/
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE || '15m',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
  refreshExpire: process.env.REFRESH_EXPIRE || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 104857600 // 100MB
};
