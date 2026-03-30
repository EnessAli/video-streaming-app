/*
  Auth controller — registration, login, token refresh and logout operations
  Works with JWT access token + refresh token pair.
  Tokens are sent both in response body and as HTTP-only cookies
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

// Cookie settings — secure is true in production
const cookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge
});

// ---------- REGISTER ----------
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  validate
];

const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Check if email or username is already taken
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          existingUser.email === email
            ? 'This email is already registered'
            : 'This username is already taken'
      });
    }

    const user = await User.create({ username, email, password });

    // Generate token pair and save refresh token to DB
    const { accessToken, refreshToken } = generateTokens(user._id);
    await saveRefreshToken(user._id, refreshToken);

    // Write to cookies
    res.cookie('accessToken', accessToken, cookieOptions(15 * 60 * 1000)); // 15min
    res.cookie('refreshToken', refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000)); // 7 days

    res.status(201).json({
      success: true,
      user: user.toJSON(),
      accessToken
    });
  } catch (error) {
    next(error);
  }
};

// ---------- LOGIN ----------
const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // select('+password') to also fetch password field — normally excluded
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
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

// ---------- TOKEN REFRESH ----------
// Frontend calls this when access token expires
const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not found'
      });
    }

    const decoded = await verifyRefreshToken(refreshToken);

    // Generate new access token
    const { accessToken } = generateTokens(decoded.id);

    res.cookie('accessToken', accessToken, cookieOptions(15 * 60 * 1000));

    res.json({
      success: true,
      accessToken
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token — please log in again'
    });
  }
};

// ---------- LOGOUT ----------
const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      await revokeRefreshToken(req.user._id, refreshToken);
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({ success: true, message: 'Successfully logged out' });
  } catch (error) {
    next(error);
  }
};

// ---------- CURRENT USER INFO ----------
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
