/*
  Auth middleware — JWT dogrulama
  Her korunmasi gereken route'a bu middleware eklenir.
  Authorization header'dan veya cookie'den token alir, dogrular
  ve req.user'a kullanici bilgisini ekler
*/
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // once Authorization header'a bak: "Bearer <token>"
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // header yoksa cookie'ye bak
  else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Bu islemi yapmak icin giris yapmaniz gerekiyor'
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);

    // kullaniciyi DB'den cek — silinmis veya banlanmis olabilir
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Bu token ile iliskili kullanici bulunamadi'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    // token suresi dolmussa frontend'e ozel kod gonder — auto refresh tetiklesin
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Oturum suresi doldu',
        code: 'TOKEN_EXPIRED'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Gecersiz token'
    });
  }
};

module.exports = protect;
