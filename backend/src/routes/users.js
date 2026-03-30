/*
  User management routes — admin only
  Listing, role update and delete endpoints
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

// All routes require admin authorization
router.use(protect, authorize('admin'));

router.get('/', getAllUsers);
router.put('/:id/role', updateUserRole);
router.delete('/:id', deleteUser);

module.exports = router;
