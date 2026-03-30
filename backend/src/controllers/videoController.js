/*
  Video controller — upload, listing, streaming, update, delete
  Multi-tenant architecture: each user can only access their own videos (except admin).
  Streaming section supports HTTP range requests — partial delivery for large videos.
*/
const Video = require('../models/Video');
const { processVideo } = require('../services/videoProcessingService');
const fs = require('fs');
const path = require('path');

// ---------- VIDEO UPLOAD ----------
// Multer middleware is defined on the route, file is already uploaded when reaching here
const uploadVideo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Video file not found'
      });
    }

    const { title, description, category, tags } = req.body;

    if (!title || title.trim().length === 0) {
      // If file was uploaded but title is missing, delete the file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Video title is required'
      });
    }

    // Create new video record
    const video = await Video.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      uploader: req.user._id,
      originalName: req.file.originalname,
      filename: req.file.filename,
      filepath: req.file.path,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      category: category || 'General',
      tags: tags ? tags.split(',').map((t) => t.trim()) : [],
      status: 'uploading'
    });

    res.status(201).json({
      success: true,
      video,
      message: 'Video uploaded, processing starting...'
    });

    // Start processing in background — after response is sent
    // io object should be attached to req from server.js
    const io = req.app.get('io');
    processVideo(video._id, io, req.user._id.toString());
  } catch (error) {
    // If error occurs, clean up uploaded file
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// ---------- USER'S VIDEOS ----------
// Multi-tenant: only returns the user's own videos
const getMyVideos = async (req, res, next) => {
  try {
    const { status, sensitivity, search, sortBy, page = 1, limit = 12 } = req.query;

    // Build filter object
    const filter = { uploader: req.user._id };

    if (status && status !== 'all') {
      filter.status = status;
    }
    if (sensitivity && sensitivity !== 'all') {
      filter.sensitivityStatus = sensitivity;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Sorting
    let sort = { createdAt: -1 }; // Default: newest first
    if (sortBy === 'oldest') sort = { createdAt: 1 };
    if (sortBy === 'title') sort = { title: 1 };
    if (sortBy === 'size') sort = { fileSize: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [videos, total] = await Promise.all([
      Video.find(filter).sort(sort).skip(skip).limit(parseInt(limit)),
      Video.countDocuments(filter)
    ]);

    res.json({
      success: true,
      videos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// ---------- ALL VIDEOS (ADMIN) ----------
const getAllVideos = async (req, res, next) => {
  try {
    const { status, sensitivity, search, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (sensitivity && sensitivity !== 'all') filter.sensitivityStatus = sensitivity;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [videos, total] = await Promise.all([
      Video.find(filter)
        .populate('uploader', 'username email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Video.countDocuments(filter)
    ]);

    res.json({
      success: true,
      videos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// ---------- SINGLE VIDEO DETAIL ----------
const getVideoById = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id).populate('uploader', 'username');

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // If not the video owner and not admin, deny access
    if (
      video.uploader._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this video'
      });
    }

    res.json({ success: true, video });
  } catch (error) {
    next(error);
  }
};

// ---------- VIDEO UPDATE ----------
const updateVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Ownership check — admin can update anything
    if (
      video.uploader.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this video'
      });
    }

    const { title, description, category, tags } = req.body;

    if (title) video.title = title.trim();
    if (description !== undefined) video.description = description.trim();
    if (category) video.category = category;
    if (tags) video.tags = tags.split(',').map((t) => t.trim());

    await video.save();

    res.json({ success: true, video });
  } catch (error) {
    next(error);
  }
};

// ---------- VIDEO DELETE ----------
const deleteVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Ownership check
    if (
      video.uploader.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this video'
      });
    }

    // First delete the file from disk
    const filePath = path.resolve(video.filepath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Video.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Video deleted' });
  } catch (error) {
    next(error);
  }
};

// ---------- VIDEO STREAMING ----------
// Partial video delivery with HTTP range request support
// Browser automatically sends range header, and we respond with 206
const streamVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Access control
    if (
      video.uploader.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this video'
      });
    }

    const filePath = path.resolve(video.filepath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Video file not found on server'
      });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Range header present — send partial content (206 Partial Content)
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      // If end not specified, send 1MB chunk
      const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + 1024 * 1024, fileSize - 1);

      if (start >= fileSize || start < 0) {
        // Invalid range — return 416
        res.status(416).set('Content-Range', `bytes */${fileSize}`);
        return res.end();
      }

      const chunkSize = end - start + 1;

      res.status(206);
      res.set({
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': video.mimeType,
        'Cache-Control': 'public, max-age=86400'
      });

      const stream = fs.createReadStream(filePath, { start, end });
      stream.pipe(res);

      stream.on('error', (err) => {
        console.error('Stream error:', err.message);
        if (!res.headersSent) {
          res.status(500).end();
        }
      });
    } else {
      // No range — send entire file (for small videos or initial request)
      res.set({
        'Content-Length': fileSize,
        'Content-Type': video.mimeType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400'
      });
      fs.createReadStream(filePath).pipe(res);
    }

    // Update view count — async, no need to block the response
    Video.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }).exec();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadVideo,
  getMyVideos,
  getAllVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  streamVideo
};
