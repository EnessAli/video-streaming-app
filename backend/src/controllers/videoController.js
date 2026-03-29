/*
  Video controller — yukleme, listeleme, streaming, guncelleme, silme
  Multi-tenant yapi: her kullanici sadece kendi videolarina erisir (admin haric).
  Streaming kismi HTTP range request destekler — buyuk videolarda parcali gonderim.
*/
const Video = require('../models/Video');
const { processVideo } = require('../services/videoProcessingService');
const fs = require('fs');
const path = require('path');

// ---------- VIDEO YUKLEME ----------
// multer middleware route'da tanimlanir, buraya geldiginde dosya zaten yuklenmis olur
const uploadVideo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Video dosyasi bulunamadi'
      });
    }

    const { title, description, category, tags } = req.body;

    if (!title || title.trim().length === 0) {
      // dosya yuklendiyse ama baslik yoksa dosyayi sil
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Video basligi zorunlu'
      });
    }

    // yeni video kaydi olustur
    const video = await Video.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      uploader: req.user._id,
      originalName: req.file.originalname,
      filename: req.file.filename,
      filepath: req.file.path,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      category: category || 'Genel',
      tags: tags ? tags.split(',').map((t) => t.trim()) : [],
      status: 'uploading'
    });

    res.status(201).json({
      success: true,
      video,
      message: 'Video yuklendi, isleme basliyor...'
    });

    // isleme arkaplanda baslat — response gittikten sonra
    // io nesnesi server.js'den req'e eklenmis olmali
    const io = req.app.get('io');
    processVideo(video._id, io, req.user._id.toString());
  } catch (error) {
    // hata olursa yuklenen dosyayi temizle
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

// ---------- KULLANICININ VIDEOLARI ----------
// multi-tenant: sadece kendi videolarini getirir
const getMyVideos = async (req, res, next) => {
  try {
    const { status, sensitivity, search, sortBy, page = 1, limit = 12 } = req.query;

    // filtre objesi olustur
    const filter = { uploader: req.user._id };

    if (status && status !== 'all') {
      filter.status = status;
    }
    if (sensitivity && sensitivity !== 'all') {
      filter.sensitivityStatus = sensitivity;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // siralama
    let sort = { createdAt: -1 }; // varsayilan: en yeniler once
    if (sortBy === 'oldest') sort = { createdAt: 1 };
    if (sortBy === 'title') sort = { title: 1 };
    if (sortBy === 'size') sort = { fileSize: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [videos, total] = await Promise.all([
      Video.find(filter).sort(sort).skip(skip).limit(parseInt(limit)),
      Video.countDocuments(filter)
    ]);

    res.json({
      success: true,
      videos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// ---------- TUM VIDEOLAR (ADMIN) ----------
const getAllVideos = async (req, res, next) => {
  try {
    const { status, sensitivity, search, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (sensitivity && sensitivity !== 'all') filter.sensitivityStatus = sensitivity;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [videos, total] = await Promise.all([
      Video.find(filter)
        .populate('uploader', 'username email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Video.countDocuments(filter)
    ]);

    res.json({
      success: true,
      videos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// ---------- TEK VIDEO DETAY ----------
const getVideoById = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id).populate('uploader', 'username');

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video bulunamadi'
      });
    }

    // video sahibi degilse ve admin degilse erisim engelle
    if (
      video.uploader._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Bu videoya erisim yetkiniz yok'
      });
    }

    res.json({ success: true, video });
  } catch (error) {
    next(error);
  }
};

// ---------- VIDEO GUNCELLEME ----------
const updateVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video bulunamadi'
      });
    }

    // sahiplik kontrolu — admin her seyi guncelleyebilir
    if (
      video.uploader.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Bu videoyu duzenleme yetkiniz yok'
      });
    }

    const { title, description, category, tags } = req.body;

    if (title) video.title = title.trim();
    if (description !== undefined) video.description = description.trim();
    if (category) video.category = category;
    if (tags) video.tags = tags.split(',').map((t) => t.trim());

    await video.save();

    res.json({ success: true, video });
  } catch (error) {
    next(error);
  }
};

// ---------- VIDEO SILME ----------
const deleteVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video bulunamadi'
      });
    }

    // sahiplik kontrolu
    if (
      video.uploader.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Bu videoyu silme yetkiniz yok'
      });
    }

    // oncelikle dosyayi diskten sil
    const filePath = path.resolve(video.filepath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Video.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Video silindi' });
  } catch (error) {
    next(error);
  }
};

// ---------- VIDEO STREAMING ----------
// HTTP range request destegi ile parcali video gonderimi
// tarayici otomatik olarak range header gonderir, biz de 206 ile cevap veririz
const streamVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video bulunamadi'
      });
    }

    // erisim kontrolu
    if (
      video.uploader.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Bu videoya erisim yetkiniz yok'
      });
    }

    const filePath = path.resolve(video.filepath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Video dosyasi bulunamadi'
      });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // range header var — parcali gonder (206 Partial Content)
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      // bitis belirtilmemisse 1MB'lik parca gonder
      const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + 1024 * 1024, fileSize - 1);

      if (start >= fileSize || start < 0) {
        // gecersiz range — 416 don
        res.status(416).set('Content-Range', `bytes */${fileSize}`);
        return res.end();
      }

      const chunkSize = end - start + 1;

      res.status(206);
      res.set({
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': video.mimeType,
        'Cache-Control': 'public, max-age=86400'
      });

      const stream = fs.createReadStream(filePath, { start, end });
      stream.pipe(res);

      stream.on('error', (err) => {
        console.error('Stream hatasi:', err.message);
        if (!res.headersSent) {
          res.status(500).end();
        }
      });
    } else {
      // range yok — tum dosyayi gonder (kucuk videolar icin veya ilk istek)
      res.set({
        'Content-Length': fileSize,
        'Content-Type': video.mimeType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=86400'
      });
      fs.createReadStream(filePath).pipe(res);
    }

    // izlenme sayacini guncelle — async, response'u beklettirmeye gerek yok
    Video.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }).exec();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadVideo,
  getMyVideos,
  getAllVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  streamVideo
};
