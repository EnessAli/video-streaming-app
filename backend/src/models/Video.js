/*
  Video modeli
  Yuklenen videolarin metadata bilgilerini tutar: baslik, aciklama, dosya bilgileri,
  isleme durumu (uploading/processing/ready/failed) ve hassasiyet sonucu (pending/safe/flagged).
  Her video bir kullaniciya (uploader) aittir — multi-tenant yapi icin
*/
const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Video basligi zorunlu'],
      trim: true,
      maxlength: [100, 'Baslik en fazla 100 karakter olabilir']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Aciklama en fazla 2000 karakter olabilir'],
      default: ''
    },
    // videoyu yukleyen kullanici — her sorgu buna gore filtrelenir
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // orijinal dosya adi — kullaniciya gostermek icin
    originalName: {
      type: String,
      required: true
    },
    // sunucudaki dosya adi — uuid ile olusturulmus benzersiz isim
    filename: {
      type: String,
      required: true
    },
    // dosyanin tam yolu
    filepath: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    // dosya boyutu byte cinsinden
    fileSize: {
      type: Number,
      required: true
    },
    // video suresi saniye cinsinden — isleme sirasinda hesaplanir
    duration: {
      type: Number,
      default: null
    },
    // videonun genel durumu
    status: {
      type: String,
      enum: ['uploading', 'processing', 'ready', 'failed'],
      default: 'uploading'
    },
    // hassasiyet analizi sonucu
    sensitivityStatus: {
      type: String,
      enum: ['pending', 'safe', 'flagged'],
      default: 'pending'
    },
    // isleme ilerleme yuzdesi — socket.io ile frontend'e gonderilir
    processingProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    // kullanici tanimlı kategori
    category: {
      type: String,
      trim: true,
      default: 'Genel'
    },
    tags: [{ type: String, trim: true }],
    views: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// sik kullanilan sorgular icin indexler
videoSchema.index({ uploader: 1, createdAt: -1 });
videoSchema.index({ sensitivityStatus: 1 });
videoSchema.index({ status: 1 });

module.exports = mongoose.model('Video', videoSchema);
