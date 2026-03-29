/*
  Token servisi — JWT islemleri
  Access token (kisa omurlu, 15dk) ve refresh token (uzun omurlu, 7 gun)
  ciftini olusturur. Refresh token DB'de saklanir, cihaz basina ayri token olur.
*/
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');

// access + refresh token cifti olustur
function generateTokens(userId) {
  const accessToken = jwt.sign(
    { id: userId },
    config.jwtSecret,
    { expiresIn: config.jwtExpire }
  );

  const refreshToken = jwt.sign(
    { id: userId },
    config.refreshTokenSecret,
    { expiresIn: config.refreshExpire }
  );

  return { accessToken, refreshToken };
}

// refresh token'i kullanicinin DB kaydina ekle
async function saveRefreshToken(userId, refreshToken) {
  const decoded = jwt.decode(refreshToken);

  await User.findByIdAndUpdate(userId, {
    $push: {
      refreshTokens: {
        token: refreshToken,
        expiresAt: new Date(decoded.exp * 1000)
      }
    }
  });

  // en fazla 5 refresh token tut — eski cihazlarin token'lari dussun
  const user = await User.findById(userId);
  if (user.refreshTokens.length > 5) {
    user.refreshTokens = user.refreshTokens.slice(-5);
    await user.save();
  }
}

// refresh token gecerli mi kontrol et
async function verifyRefreshToken(refreshToken) {
  // once JWT imzasini dogrula
  const decoded = jwt.verify(refreshToken, config.refreshTokenSecret);

  // sonra DB'de var mi bak — cikis yapildiysa silinmis olur
  const user = await User.findById(decoded.id);
  if (!user) {
    throw new Error('Kullanici bulunamadi');
  }

  const tokenExists = user.refreshTokens.some((rt) => rt.token === refreshToken);
  if (!tokenExists) {
    throw new Error('Refresh token gecersiz veya iptal edilmis');
  }

  return decoded;
}

// cikis yapildiginda refresh token'i DB'den sil
async function revokeRefreshToken(userId, refreshToken) {
  await User.findByIdAndUpdate(userId, {
    $pull: { refreshTokens: { token: refreshToken } }
  });
}

// tum refresh token'lari sil — sifre degisikligi gibi durumlarda
async function revokeAllTokens(userId) {
  await User.findByIdAndUpdate(userId, {
    $set: { refreshTokens: [] }
  });
}

module.exports = {
  generateTokens,
  saveRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllTokens
};
