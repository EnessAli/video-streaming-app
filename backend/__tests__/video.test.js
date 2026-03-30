/* Video model and helper function tests */
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

// Video model tests
describe('Video Model', () => {
  let testUser;

  beforeEach(async () => {
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test1234!'
    });
  });

  it('should create a video with valid data', async () => {
    const video = await Video.create({
      title: 'Test Video',
      description: 'This is a test video',
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

  it('should not create a video without title', async () => {
    try {
      await Video.create({
        uploader: testUser._id,
        originalFilename: 'video.mp4',
        filename: 'abc123.mp4',
        filepath: '/uploads/videos/abc123.mp4',
        mimeType: 'video/mp4',
        fileSize: 1024
      });
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(mongoose.Error.ValidationError);
    }
  });

  it('should be able to update video status', async () => {
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

  it('should be able to list user videos', async () => {
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

// User model tests
describe('User Model', () => {
  it('should save password as hashed', async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test1234!'
    });

    expect(user.password).not.toBe('Test1234!');
    expect(user.password).toMatch(/^\$2[aby]?\$/);
  });

  it('should validate password correctly', async () => {
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

  it('toJSON should hide sensitive data', async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test1234!'
    });

    const json = user.toJSON();
    expect(json).not.toHaveProperty('password');
    expect(json).not.toHaveProperty('refreshTokens');
  });

  it('default role should be viewer', async () => {
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Test1234!'
    });

    expect(user.role).toBe('viewer');
  });
});

// Helper function tests
describe('Helper Functions', () => {
  describe('formatFileSize', () => {
    it('should convert byte size to readable format', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(52428800)).toBe('50 MB');
    });
  });

  describe('sanitizeFilename', () => {
    it('should sanitize dangerous characters', () => {
      expect(sanitizeFilename('my video.mp4')).toBe('my_video.mp4');
      expect(sanitizeFilename('../hack.mp4')).toBe('hack.mp4');
      expect(sanitizeFilename('test<script>.mp4')).toBe('testscript.mp4');
    });
  });
});
