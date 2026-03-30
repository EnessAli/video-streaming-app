/*
  Socket.io configuration and connection management
  Each user joins their own "room" (user:{userId}).
  During video processing, progress info is sent only to the relevant user.
  JWT authentication is used — unauthorized connections are rejected
*/
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config/env');

function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: config.frontendUrl,
      credentials: true
    }
  });

  // JWT check before connection
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId} (socket: ${socket.id})`);

    // Join user-specific room — processing events will be sent here
    socket.join(`user:${socket.userId}`);

    // Disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });

    // Error logging
    socket.on('error', (err) => {
      console.error(`Socket error (${socket.userId}):`, err.message);
    });
  });

  return io;
}

module.exports = initializeSocket;
