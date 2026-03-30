/*
  Main server file
  Starts the Express application, HTTP server and Socket.io.
  Middleware chains, route definitions and error handling are here.
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

// Route files
const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/videos');
const userRoutes = require('./routes/users');

// Express application
const app = express();
const server = http.createServer(app);

// Start socket.io and attach to app — accessible from controllers
const io = initializeSocket(server);
app.set('io', io);

// ---------- MIDDLEWARE CHAIN ----------

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS — allow requests from frontend
const allowedOrigins = [
  config.frontendUrl,
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // allow server-side requests (no origin) or matching origins
    if (!origin) return callback(null, true);
    // allow exact match or any vercel preview deploy
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed: ' + origin));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request logging — detailed in development, short in production
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));

// JSON and cookie parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting — brute force protection
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP
  message: { success: false, message: 'Too many requests, please try again in 15 minutes' }
});
app.use('/api/', limiter);

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts, please try again in 15 minutes' }
});
app.use('/api/auth', authLimiter);

// ---------- ROUTE DEFINITIONS ----------
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date() });
});

// ---------- ERROR HANDLING ----------
// Undefined route
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Global error handler — all errors fall through to here
app.use(errorHandler);

// ---------- START SERVER ----------
const PORT = config.port;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (${config.nodeEnv})`);
    console.log(`Frontend URL: ${config.frontendUrl}`);
  });
});

module.exports = { app, server };
