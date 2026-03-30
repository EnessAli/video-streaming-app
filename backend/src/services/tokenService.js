/*
  Token service — JWT operations
  Creates access token (short-lived, 15min) and refresh token (long-lived, 7 days)
  pair. Refresh token is stored in DB, separate token per device.
*/
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');

// Generate access + refresh token pair
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

// Add refresh token to user's DB record
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

  // Keep at most 5 refresh tokens — older device tokens get dropped
  const user = await User.findById(userId);
  if (user.refreshTokens.length > 5) {
    user.refreshTokens = user.refreshTokens.slice(-5);
    await user.save();
  }
}

// Check if refresh token is valid
async function verifyRefreshToken(refreshToken) {
  // First verify the JWT signature
  const decoded = jwt.verify(refreshToken, config.refreshTokenSecret);

  // Then check if it exists in DB — it would be deleted if logged out
  const user = await User.findById(decoded.id);
  if (!user) {
    throw new Error('User not found');
  }

  const tokenExists = user.refreshTokens.some((rt) => rt.token === refreshToken);
  if (!tokenExists) {
    throw new Error('Refresh token is invalid or has been revoked');
  }

  return decoded;
}

// Delete refresh token from DB on logout
async function revokeRefreshToken(userId, refreshToken) {
  await User.findByIdAndUpdate(userId, {
    $pull: { refreshTokens: { token: refreshToken } }
  });
}

// Delete all refresh tokens — for cases like password change
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
