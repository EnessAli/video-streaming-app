/*
  MongoDB database connection
  Connects to Atlas cluster using Mongoose,
  logs connection errors and implements retry mechanism
*/
const mongoose = require('mongoose');
const config = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    // Retry after 5 seconds
    setTimeout(connectDB, 5000);
  }
};

// Log on disconnection
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error(`MongoDB error: ${err.message}`);
});

module.exports = connectDB;
