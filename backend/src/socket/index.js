/*
  Socket.io yapilandirmasi ve baglanti yonetimi
  Her kullanici kendi "room"una katilir (user:{userId}).
  Video isleme sirasinda sadece ilgili kullaniciya progress bilgisi gider.
  JWT ile kimlik dogrulamasi yapilir — yetkisiz baglanti kabul edilmez
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

  // baglanti oncesi JWT kontrolu
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Kimlik dogrulama gerekli'));
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      return next(new Error('Gecersiz token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Kullanici baglandi: ${socket.userId} (socket: ${socket.id})`);

    // kullaniciya ozel room'a katil — processing eventleri buraya gonderilecek
    socket.join(`user:${socket.userId}`);

    // baglanti kopma
    socket.on('disconnect', () => {
      console.log(`Kullanici ayrildi: ${socket.userId}`);
    });

    // hata loglama
    socket.on('error', (err) => {
      console.error(`Socket hatasi (${socket.userId}):`, err.message);
    });
  });

  return io;
}

module.exports = initializeSocket;
