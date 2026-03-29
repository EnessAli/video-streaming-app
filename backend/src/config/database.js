/*
  MongoDB veritabani baglantisi
  Mongoose kullanarak Atlas cluster'a baglanir,
  baglanti hatalarini loglar ve retry mekanizmasi uygular
*/
const mongoose = require('mongoose');
const config = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri);
    console.log(`MongoDB baglandi: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB baglanti hatasi: ${error.message}`);
    // 5 saniye sonra tekrar dene
    setTimeout(connectDB, 5000);
  }
};

// baglanti kopma durumunda loglama
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB baglantisi koptu');
});

mongoose.connection.on('error', (err) => {
  console.error(`MongoDB hata: ${err.message}`);
});

module.exports = connectDB;
