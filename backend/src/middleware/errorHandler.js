/*
  Global hata yakalama middleware'i
  Tum route'lardan firlatilan hatalari yakalar,
  hata tipine gore uygun HTTP kodu ve mesaj doner.
  Multer hatalari (dosya boyutu vb) icin ozel handling var
*/
const errorHandler = (err, req, res, next) => {
  console.error('Hata:', err.message);

  // multer dosya boyutu hatasi
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'Dosya boyutu cok buyuk. Maksimum 100MB yuklenebilir'
    });
  }

  // multer genel hata (yanlis dosya tipi vs)
  if (err.message && err.message.includes('Gecersiz dosya tipi')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  // mongoose validation hatasi — form alanlari hatali doldurulmus
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: messages.join(', ')
    });
  }

  // mongoose duplicate key — zaten kayitli email veya username
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `Bu ${field} zaten kullaniliyor`
    });
  }

  // mongoose cast error — gecersiz ObjectId formati
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Gecersiz ID formati'
    });
  }

  // bilinmeyen hata
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Sunucu hatasi'
  });
};

module.exports = errorHandler;
