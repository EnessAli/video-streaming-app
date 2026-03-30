/* Auth endpoint testleri */
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const cookieParser = require('cookie-parser');

const User = require('../src/models/User');
const authRoutes = require('../src/routes/auth');
const errorHandler = require('../src/middleware/errorHandler');

let mongoServer;
let app;

// Create test application
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRoutes);
  app.use(errorHandler);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

// Registration tests
describe('POST /api/auth/register', () => {
  it('should successfully register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test1234!'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.user.role).toBe('viewer');
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('should not allow registration with the same email', async () => {
    await User.create({
      username: 'existing',
      email: 'test@example.com',
      password: 'Test1234!'
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'newuser',
        email: 'test@example.com',
        password: 'Test1234!'
      });

    expect(res.statusCode).toBe(400);
  });

  it('should not allow registration with missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com'
      });

    expect(res.statusCode).toBe(400);
  });
});

// Login tests
describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test1234!'
      });
  });

  it('should login successfully with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Test1234!'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('should not allow login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword'
      });

    expect(res.statusCode).toBe(401);
  });

  it('should not allow login with non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'Test1234!'
      });

    expect(res.statusCode).toBe(401);
  });
});

// Token refresh tests
describe('POST /api/auth/refresh', () => {
  it('should get a new token with valid refresh token', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test1234!'
      });

    const refreshToken = registerRes.body.refreshToken;

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
  });

  it('should reject invalid refresh token', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'invalid-token' });

    expect(res.statusCode).toBe(401);
  });
});

// Current user info
describe('GET /api/auth/me', () => {
  it('should get user info with token', async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Test1234!'
      });

    const token = registerRes.body.accessToken;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe('test@example.com');
  });

  it('should deny access without token', async () => {
    const res = await request(app)
      .get('/api/auth/me');

    expect(res.statusCode).toBe(401);
  });
});
