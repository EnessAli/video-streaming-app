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

// Test uygulaması oluştur
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

// Kayıt testleri
describe('POST /api/auth/register', () => {
  it('yeni kullanıcı kaydı başarılı olmalı', async () => {
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

  it('aynı email ile tekrar kayıt yapılamamalı', async () => {
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

  it('eksik alanlarla kayıt yapılamamalı', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com'
      });

    expect(res.statusCode).toBe(400);
  });
});

// Giriş testleri
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

  it('doğru bilgilerle giriş başarılı olmalı', async () => {
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

  it('yanlış şifre ile giriş yapılamamalı', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword'
      });

    expect(res.statusCode).toBe(401);
  });

  it('olmayan email ile giriş yapılamamalı', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'Test1234!'
      });

    expect(res.statusCode).toBe(401);
  });
});

// Token yenileme testleri
describe('POST /api/auth/refresh', () => {
  it('geçerli refresh token ile yeni token alınabilmeli', async () => {
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

  it('geçersiz refresh token reddedilmeli', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'invalid-token' });

    expect(res.statusCode).toBe(401);
  });
});

// Mevcut kullanıcı bilgisi
describe('GET /api/auth/me', () => {
  it('token ile kullanıcı bilgisi alınabilmeli', async () => {
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

  it('token olmadan erişim reddedilmeli', async () => {
    const res = await request(app)
      .get('/api/auth/me');

    expect(res.statusCode).toBe(401);
  });
});
