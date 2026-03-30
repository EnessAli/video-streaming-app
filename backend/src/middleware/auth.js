/*
  Auth middleware — JWT verification
  This middleware is added to every route that needs protection.
  Gets token from Authorization header or cookie, verifies it
  and attaches user info to req.user
*/
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // First check Authorization header: "Bearer <token>"
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // If no header, check cookie
  else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'You need to log in to perform this action'
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);

    // Fetch user from DB — they may have been deleted or banned
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'No user found associated with this token'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    // If token has expired, send special code to frontend — trigger auto refresh
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session has expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

module.exports = protect;
