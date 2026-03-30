/*
  Ana sunucu dosyasi
  Express uygulamasini, HTTP sunucusunu ve Socket.io'yu baslatir.
  Middleware zincirleri, route tanimlari ve hata yakalama burada.
*/
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');

const config = require('./config/env');
const connectDB = require('./config/database');
const initializeSocket = require('./socket');
const errorHandler = require('./middleware/errorHandler');

// route dosyalari
const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/videos');
const userRoutes = require('./routes/users');

// express uygulamasi
const app = express();
const server = http.createServer(app);

// socket.io baslat ve app'e ekle — controller'lardan erisilebilsin
const io = initializeSocket(server);
app.set('io', io);

// ---------- MIDDLEWARE ZINCIRI ----------

// guvenlik header'lari
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS — frontend'den gelen istekleri kabul et
const allowedOrigins = [
  config.frontendUrl,
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // sunucu-tarafli istekler (origin yok) veya izinli originler
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS izni yok: ' + origin));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// istek loglama — development'ta detayli, production'da kisa
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));

// JSON ve cookie parse
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// rate limiting — brute force korunmasi
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // IP basina 100 istek
  message: { success: false, message: 'Cok fazla istek gonderdiniz, 15 dakika sonra tekrar deneyin' }
});
app.use('/api/', limiter);

// auth endpointleri icin daha siki limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Cok fazla giris denemesi, 15 dakika sonra tekrar deneyin' }
});
app.use('/api/auth', authLimiter);

// ---------- ROUTE TANIMLARI ----------
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/users', userRoutes);

// saglik kontrolu
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Sunucu calisiyor', timestamp: new Date() });
});

// ---------- HATA YAKALAMA ----------
// tanimlanmamis route
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Endpoint bulunamadi' });
});

// global hata handler — tum hatalar buraya duser
app.use(errorHandler);

// ---------- SUNUCUYU BASLAT ----------
const PORT = config.port;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda calisiyor (${config.nodeEnv})`);
    console.log(`Frontend URL: ${config.frontendUrl}`);
  });
});

module.exports = { app, server };
