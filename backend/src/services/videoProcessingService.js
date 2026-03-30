/*
  Video sensitivity analysis service (simulation)
  Instead of a real AI service, simulates video processing:
  - Gradual progress from 0 to 100
  - Sends progress to frontend via Socket.io at each step
  - Results in "safe" with 80% probability, "flagged" with 20%
  
  In a real project, this would connect to an AI API (Google Video Intelligence,
  AWS Rekognition, etc.)
*/
const Video = require('../models/Video');

// This function is called after upload is complete
async function processVideo(videoId, io, userId) {
  try {
    // First set the video to "processing" status
    await Video.findByIdAndUpdate(videoId, {
      status: 'processing',
      processingProgress: 0
    });

    // Notify frontend that processing has started
    io.to(`user:${userId}`).emit('video:processing', {
      videoId,
      progress: 0,
      step: 'Validating file...'
    });

    // Analysis steps — each simulates a different check
    const steps = [
      { progress: 10, step: 'Reading video file...', delay: 800 },
      { progress: 20, step: 'Frame analysis started...', delay: 1200 },
      { progress: 35, step: 'Scanning visual content...', delay: 1500 },
      { progress: 50, step: 'Audio analysis in progress...', delay: 1000 },
      { progress: 65, step: 'Checking text detection...', delay: 1300 },
      { progress: 75, step: 'Filtering sensitive content...', delay: 1100 },
      { progress: 85, step: 'Compiling results...', delay: 900 },
      { progress: 95, step: 'Final checks...', delay: 700 },
      { progress: 100, step: 'Analysis complete', delay: 500 }
    ];

    // Run each step sequentially and report progress
    for (const s of steps) {
      await new Promise((resolve) => setTimeout(resolve, s.delay));

      await Video.findByIdAndUpdate(videoId, {
        processingProgress: s.progress
      });

      io.to(`user:${userId}`).emit('video:processing', {
        videoId,
        progress: s.progress,
        step: s.step
      });
    }

    // Random result — 80% safe, 20% flagged
    const isSafe = Math.random() < 0.8;
    const sensitivityStatus = isSafe ? 'safe' : 'flagged';

    // Update video — now ready to watch
    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      {
        status: 'ready',
        sensitivityStatus,
        processingProgress: 100
      },
      { new: true }
    );

    // Notify frontend of the result
    io.to(`user:${userId}`).emit('video:processed', {
      videoId,
      sensitivityStatus,
      video: updatedVideo
    });

    return updatedVideo;
  } catch (error) {
    console.error('Video processing error:', error.message);

    // If error occurs, mark video as failed
    await Video.findByIdAndUpdate(videoId, {
      status: 'failed',
      processingProgress: 0
    });

    io.to(`user:${userId}`).emit('video:failed', {
      videoId,
      error: 'An error occurred during video processing'
    });
  }
}

module.exports = { processVideo };
