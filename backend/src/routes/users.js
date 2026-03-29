/*
  Kullanici yonetimi route'lari — admin only
  Listeleme, rol guncelleme ve silme endpointleri
*/
const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const authorize = require('../middleware/roleCheck');
const {
  getAllUsers,
  updateUserRole,
  deleteUser
} = require('../controllers/userController');

// tum route'lar admin yetkisi gerektirir
router.use(protect, authorize('admin'));

router.get('/', getAllUsers);
router.put('/:id/role', updateUserRole);
router.delete('/:id', deleteUser);

module.exports = router;
