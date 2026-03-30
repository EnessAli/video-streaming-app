/*
  Video model
  Stores metadata of uploaded videos: title, description, file info,
  processing status (uploading/processing/ready/failed) and sensitivity result (pending/safe/flagged).
  Each video belongs to a user (uploader) — for multi-tenant architecture
*/
const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Video title is required'],
      trim: true,
      maxlength: [100, 'Title can be at most 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description can be at most 2000 characters'],
      default: ''
    },
    // User who uploaded the video — every query is filtered by this
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // Original file name — for displaying to user
    originalName: {
      type: String,
      required: true
    },
    // File name on server — unique name generated with uuid
    filename: {
      type: String,
      required: true
    },
    // Full path of the file
    filepath: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    // File size in bytes
    fileSize: {
      type: Number,
      required: true
    },
    // Video duration in seconds — calculated during processing
    duration: {
      type: Number,
      default: null
    },
    // Overall status of the video
    status: {
      type: String,
      enum: ['uploading', 'processing', 'ready', 'failed'],
      default: 'uploading'
    },
    // Sensitivity analysis result
    sensitivityStatus: {
      type: String,
      enum: ['pending', 'safe', 'flagged'],
      default: 'pending'
    },
    // Processing progress percentage — sent to frontend via socket.io
    processingProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    // User-defined category
    category: {
      type: String,
      trim: true,
      default: 'General'
    },
    tags: [{ type: String, trim: true }],
    views: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// Indexes for frequently used queries
videoSchema.index({ uploader: 1, createdAt: -1 });
videoSchema.index({ sensitivityStatus: 1 });
videoSchema.index({ status: 1 });

module.exports = mongoose.model('Video', videoSchema);
