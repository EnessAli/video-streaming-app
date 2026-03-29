/*
  Kullanici modeli
  Kayit, giris ve yetkilendirme islemlerinde kullanilir.
  Roller: viewer (sadece izleme), editor (yukleme+duzenleme), admin (tam yetki)
  Sifre bcrypt ile hashlenir, refresh token'lar dizide tutulur
*/
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Kullanici adi zorunlu'],
      unique: true,
      trim: true,
      minlength: [3, 'Kullanici adi en az 3 karakter olmali'],
      maxlength: [30, 'Kullanici adi en fazla 30 karakter olabilir']
    },
    email: {
      type: String,
      required: [true, 'Email zorunlu'],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Gecerli bir email girin']
    },
    password: {
      type: String,
      required: [true, 'Sifre zorunlu'],
      minlength: [6, 'Sifre en az 6 karakter olmali'],
      select: false // sorgularda sifre donmez, acikca istenmedikce
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'admin'],
      default: 'editor'
    },
    // refresh token'lari takip etmek icin — birden fazla cihazda acik olabilir
    refreshTokens: [
      {
        token: { type: String, required: true },
        expiresAt: { type: Date, required: true }
      }
    ]
  },
  { timestamps: true }
);

// kaydetmeden once sifreyi hashle
userSchema.pre('save', async function (next) {
  // sifre degismediyse tekrar hashleme
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// giriste sifre karsilastirmasi icin
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// JSON'a cevirirken hassas bilgileri cikar
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.refreshTokens;
  delete user.__v;
  return user;
};

module.exports = mongoose.model('User', userSchema);
