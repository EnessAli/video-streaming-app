/*
  User management controller — admin access only
  List all users, change roles and delete operations
*/
const User = require('../models/User');
const Video = require('../models/Video');
const fs = require('fs');
const path = require('path');

// Get all users — for the admin panel table
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-refreshTokens').sort({ createdAt: -1 });

    // Also send each user's video count
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const videoCount = await Video.countDocuments({ uploader: user._id });
        return { ...user.toJSON(), videoCount };
      })
    );

    res.json({ success: true, users: usersWithStats });
  } catch (error) {
    next(error);
  }
};

// Update user role — admin can change another user's role
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const validRoles = ['viewer', 'editor', 'admin'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Valid roles: viewer, editor, admin'
      });
    }

    // Prevent changing own role
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own role'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({ success: true, user: user.toJSON() });
  } catch (error) {
    next(error);
  }
};

// Delete user — also clean up their videos
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find all user's videos and delete their files
    const videos = await Video.find({ uploader: user._id });
    for (const video of videos) {
      const filePath = path.resolve(video.filepath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete videos and user from DB
    await Video.deleteMany({ uploader: user._id });
    await User.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'User and their videos have been deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllUsers, updateUserRole, deleteUser };
