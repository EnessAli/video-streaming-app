/*
  Video routes
  Upload, listing, detail, update, delete and streaming endpoints.
  Multer middleware only runs on the upload route
*/
const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const authorize = require('../middleware/roleCheck');
const upload = require('../config/multer');
const {
  uploadVideo,
  getMyVideos,
  getAllVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  streamVideo
} = require('../controllers/videoController');

// All routes require authentication
router.use(protect);

// Video upload — editor and admin only
router.post('/upload', authorize('editor', 'admin'), upload.single('video'), uploadVideo);

// User's own videos
router.get('/', getMyVideos);

// All videos for admin
router.get('/all', authorize('admin'), getAllVideos);

// Single video detail
router.get('/:id', getVideoById);

// Video update — editor and admin (ownership check in controller)
router.put('/:id', authorize('editor', 'admin'), updateVideo);

// Video delete
router.delete('/:id', authorize('editor', 'admin'), deleteVideo);

// Video streaming — separate path for clarity
router.get('/stream/:id', streamVideo);

module.exports = router;
