/*
  Video hassasiyet analizi servisi (simulasyon)
  Gercek bir AI servisi yerine, video islemeyi simule eder:
  - 0'dan 100'e kadar asamali ilerleme
  - her adimda Socket.io ile frontend'e progress gonderir
  - sonucta %80 ihtimalle "safe", %20 ihtimalle "flagged" olarak isaretler
  
  Gercek projede burasi bir AI API'sine (Google Video Intelligence,
  AWS Rekognition vs) baglanir
*/
const Video = require('../models/Video');

// bu fonksiyon upload tamamlandiktan sonra cagirilir
async function processVideo(videoId, io, userId) {
  try {
    // once videoyu "processing" durumuna al
    await Video.findByIdAndUpdate(videoId, {
      status: 'processing',
      processingProgress: 0
    });

    // frontend'e islemenin basladigini bildir
    io.to(`user:${userId}`).emit('video:processing', {
      videoId,
      progress: 0,
      step: 'Dosya dogrulaniyor...'
    });

    // analiz asamalari — her biri farkli bir kontrol simule ediyor
    const steps = [
      { progress: 10, step: 'Video dosyasi okunuyor...', delay: 800 },
      { progress: 20, step: 'Frame analizi basladi...', delay: 1200 },
      { progress: 35, step: 'Gorsel icerik taraniyor...', delay: 1500 },
      { progress: 50, step: 'Ses analizi yapiliyor...', delay: 1000 },
      { progress: 65, step: 'Metin tespiti kontrol ediliyor...', delay: 1300 },
      { progress: 75, step: 'Hassas icerik filtreleniyor...', delay: 1100 },
      { progress: 85, step: 'Sonuclar derleniyor...', delay: 900 },
      { progress: 95, step: 'Son kontroller...', delay: 700 },
      { progress: 100, step: 'Analiz tamamlandi', delay: 500 }
    ];

    // her adimi sirayla calistir ve progress bildir
    for (const s of steps) {
      await new Promise((resolve) => setTimeout(resolve, s.delay));

      await Video.findByIdAndUpdate(videoId, {
        processingProgress: s.progress
      });

      io.to(`user:${userId}`).emit('video:processing', {
        videoId,
        progress: s.progress,
        step: s.step
      });
    }

    // rastgele sonuc — %80 safe, %20 flagged
    const isSafe = Math.random() < 0.8;
    const sensitivityStatus = isSafe ? 'safe' : 'flagged';

    // videoyu guncelle — artik izlenmeye hazir
    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      {
        status: 'ready',
        sensitivityStatus,
        processingProgress: 100
      },
      { new: true }
    );

    // sonucu frontend'e bildir
    io.to(`user:${userId}`).emit('video:processed', {
      videoId,
      sensitivityStatus,
      video: updatedVideo
    });

    return updatedVideo;
  } catch (error) {
    console.error('Video isleme hatasi:', error.message);

    // hata olursa videoyu failed olarak isaretle
    await Video.findByIdAndUpdate(videoId, {
      status: 'failed',
      processingProgress: 0
    });

    io.to(`user:${userId}`).emit('video:failed', {
      videoId,
      error: 'Video isleme sirasinda hata olustu'
    });
  }
}

module.exports = { processVideo };
