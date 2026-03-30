/* Video model ve yardımcı fonksiyon testleri */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const Video = require('../src/models/Video');
const User = require('../src/models/User');
const { formatFileSize, sanitizeFilename } = require('../src/utils/helpers');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Video.deleteMany({});
  await User.deleteMany({});
});

// Video model testleri
describe('Video Model', () => {
  let testUser;

  beforeEach(async () => {
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test1234!'
    });
  });

  it('geçerli verilerle video oluşturulabilmeli', async () => {
    const video = await Video.create({
      title: 'Test Video',
      description: 'Bu bir test videosu',
      uploader: testUser._id,
      originalFilename: 'video.mp4',
      filename: 'abc123.mp4',
      filepath: '/uploads/videos/abc123.mp4',
      mimeType: 'video/mp4',
      fileSize: 52428800
    });

    expect(video.title).toBe('Test Video');
    expect(video.status).toBe('uploading');
    expect(video.sensitivityStatus).toBe('pending');
    expect(video.isPublic).toBe(true);
  });

  it('başlık olmadan video oluşturulamamalı', async () => {
    try {
      await Video.create({
        uploader: testUser._id,
        originalFilename: 'video.mp4',
        filename: 'abc123.mp4',
        filepath: '/uploads/videos/abc123.mp4',
        mimeType: 'video/mp4',
        fileSize: 1024
      });
      fail('Hata fırlatılmalıydı');
    } catch (error) {
      expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
    }
  });

  it('video durumu güncellenebilmeli', async () => {
    const video = await Video.create({
      title: 'Test Video',
      uploader: testUser._id,
      originalFilename: 'video.mp4',
      filename: 'abc123.mp4',
      filepath: '/uploads/videos/abc123.mp4',
      mimeType: 'video/mp4',
      fileSize: 1024
    });

    video.status = 'ready';
    video.sensitivityStatus = 'safe';
    video.sensitivityScore = 0.15;
    await video.save();

    const updated = await Video.findById(video._id);
    expect(updated.status).toBe('ready');
    expect(updated.sensitivityStatus).toBe('safe');
    expect(updated.sensitivityScore).toBe(0.15);
  });

  it('kullanıcının videolarını listeleyebilmeli', async () => {
    await Video.create([
      {
        title: 'Video 1',
        uploader: testUser._id,
        originalFilename: 'v1.mp4',
        filename: 'a1.mp4',
        filepath: '/uploads/videos/a1.mp4',
        mimeType: 'video/mp4',
        fileSize: 1024
      },
      {
        title: 'Video 2',
        uploader: testUser._id,
        originalFilename: 'v2.mp4',
        filename: 'a2.mp4',
        filepath: '/uploads/videos/a2.mp4',
        mimeType: 'video/mp4',
        fileSize: 2048
      }
    ]);

    const videos = await Video.find({ uploader: testUser._id });
    expect(videos).toHaveLength(2);
  });
});

// User model testleri
describe('User Model', () => {
  it('şifre hashlenmiş olarak kaydedilmeli', async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test1234!'
    });

    expect(user.password).not.toBe('Test1234!');
    expect(user.password).toMatch(/^\$2[aby]?\$/);
  });

  it('şifre doğrulama çalışmalı', async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test1234!'
    });

    const isMatch = await user.matchPassword('Test1234!');
    expect(isMatch).toBe(true);

    const isWrong = await user.matchPassword('wrongpass');
    expect(isWrong).toBe(false);
  });

  it('toJSON hassas verileri gizlemeli', async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test1234!'
    });

    const json = user.toJSON();
    expect(json).not.toHaveProperty('password');
    expect(json).not.toHaveProperty('refreshTokens');
  });

  it('varsayılan rol viewer olmalı', async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test1234!'
    });

    expect(user.role).toBe('viewer');
  });
});

// Yardımcı fonksiyon testleri
describe('Helper Functions', () => {
  describe('formatFileSize', () => {
    it('byte boyutunu okunabilir formata çevirmeli', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(52428800)).toBe('50 MB');
    });
  });

  describe('sanitizeFilename', () => {
    it('tehlikeli karakterleri temizlemeli', () => {
      expect(sanitizeFilename('my video.mp4')).toBe('my_video.mp4');
      expect(sanitizeFilename('../hack.mp4')).toBe('hack.mp4');
      expect(sanitizeFilename('test<script>.mp4')).toBe('testscript.mp4');
    });
  });
});
