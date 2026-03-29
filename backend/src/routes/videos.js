/*
  Video route'lari
  Upload, listeleme, detay, guncelleme, silme ve streaming endpointleri.
  Multer middleware sadece upload route'unda calisir
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

// tum route'lar oturum gerektirir
router.use(protect);

// video yukleme — sadece editor ve admin
router.post('/upload', authorize('editor', 'admin'), upload.single('video'), uploadVideo);

// kullanicinin kendi videolari
router.get('/', getMyVideos);

// admin icin tum videolar
router.get('/all', authorize('admin'), getAllVideos);

// tek video detay
router.get('/:id', getVideoById);

// video guncelleme — editor ve admin (sahiplik kontrolu controller'da)
router.put('/:id', authorize('editor', 'admin'), updateVideo);

// video silme
router.delete('/:id', authorize('editor', 'admin'), deleteVideo);

// video streaming — ayri path, kolay anlasilsin
router.get('/stream/:id', streamVideo);

module.exports = router;
