/*
  Kullanici yonetimi controller'i — sadece admin erisebilir
  Tum kullanicilari listeleme, rol degistirme ve silme islemleri
*/
const User = require('../models/User');
const Video = require('../models/Video');
const fs = require('fs');
const path = require('path');

// tum kullanicilari getir — admin panelde tablo icin
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-refreshTokens').sort({ createdAt: -1 });

    // her kullanicinin video sayisini da gonder
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const videoCount = await Video.countDocuments({ uploader: user._id });
        return { ...user.toJSON(), videoCount };
      })
    );

    res.json({ success: true, users: usersWithStats });
  } catch (error) {
    next(error);
  }
};

// kullanici rolunu guncelle — admin baskasinin rolunu degistirebilir
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const validRoles = ['viewer', 'editor', 'admin'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Gecersiz rol. Gecerli roller: viewer, editor, admin'
      });
    }

    // kendi rolunu degistirmeye calismasin
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Kendi rolunuzu degistiremezsiniz'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanici bulunamadi'
      });
    }

    res.json({ success: true, user: user.toJSON() });
  } catch (error) {
    next(error);
  }
};

// kullaniciyi sil — videolarini da temizle
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Kendi hesabinizi silemezsiniz'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanici bulunamadi'
      });
    }

    // kullanicinin tum videolarini bul ve dosyalarini sil
    const videos = await Video.find({ uploader: user._id });
    for (const video of videos) {
      const filePath = path.resolve(video.filepath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // DB'den videolari ve kullaniciyi sil
    await Video.deleteMany({ uploader: user._id });
    await User.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Kullanici ve videolari silindi' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllUsers, updateUserRole, deleteUser };
