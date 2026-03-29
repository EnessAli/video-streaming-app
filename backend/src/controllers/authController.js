/*
  Auth controller — kayit, giris, token yenileme ve cikis islemleri
  JWT access token + refresh token cifti ile calisir.
  Token'lar hem response body'de hem HTTP-only cookie olarak gonderilir
*/
const { body } = require('express-validator');
const User = require('../models/User');
const validate = require('../middleware/validate');
const {
  generateTokens,
  saveRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllTokens
} = require('../services/tokenService');

// cookie ayarlari — production'da secure true olur
const cookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge
});

// ---------- KAYIT ----------
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Kullanici adi 3-30 karakter olmali'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Gecerli bir email girin'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Sifre en az 6 karakter olmali'),
  validate
];

const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // email veya username daha once alinmis mi
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          existingUser.email === email
            ? 'Bu email zaten kayitli'
            : 'Bu kullanici adi zaten alinmis'
      });
    }

    const user = await User.create({ username, email, password });

    // token cifti olustur ve refresh token'i DB'ye kaydet
    const { accessToken, refreshToken } = generateTokens(user._id);
    await saveRefreshToken(user._id, refreshToken);

    // cookie'lere yaz
    res.cookie('accessToken', accessToken, cookieOptions(15 * 60 * 1000)); // 15dk
    res.cookie('refreshToken', refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000)); // 7 gun

    res.status(201).json({
      success: true,
      user: user.toJSON(),
      accessToken
    });
  } catch (error) {
    next(error);
  }
};

// ---------- GIRIS ----------
const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Gecerli bir email girin'),
  body('password').notEmpty().withMessage('Sifre gerekli'),
  validate
];

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // select('+password') ile sifre alanini da getir — normalde gelmez
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email veya sifre hatali'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email veya sifre hatali'
      });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    await saveRefreshToken(user._id, refreshToken);

    res.cookie('accessToken', accessToken, cookieOptions(15 * 60 * 1000));
    res.cookie('refreshToken', refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000));

    res.json({
      success: true,
      user: user.toJSON(),
      accessToken
    });
  } catch (error) {
    next(error);
  }
};

// ---------- TOKEN YENILEME ----------
// access token suresi dolunca frontend buraya istek atar
const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token bulunamadi'
      });
    }

    const decoded = await verifyRefreshToken(refreshToken);

    // yeni access token olustur
    const { accessToken } = generateTokens(decoded.id);

    res.cookie('accessToken', accessToken, cookieOptions(15 * 60 * 1000));

    res.json({
      success: true,
      accessToken
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Gecersiz refresh token — tekrar giris yapin'
    });
  }
};

// ---------- CIKIS ----------
const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await revokeRefreshToken(req.user._id, refreshToken);
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({ success: true, message: 'Basariyla cikis yapildi' });
  } catch (error) {
    next(error);
  }
};

// ---------- MEVCUT KULLANICI BILGISI ----------
const getMe = async (req, res) => {
  res.json({
    success: true,
    user: req.user.toJSON()
  });
};

module.exports = {
  register,
  registerValidation,
  login,
  loginValidation,
  refresh,
  logout,
  getMe
};
