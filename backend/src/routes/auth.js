/*
  Auth route'lari
  Kayit, giris, token yenileme, cikis ve kullanici bilgisi endpointleri
*/
const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const {
  register,
  registerValidation,
  login,
  loginValidation,
  refresh,
  logout,
  getMe
} = require('../controllers/authController');

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/refresh', refresh);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router;
