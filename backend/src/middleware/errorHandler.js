/*
  Global error handling middleware
  Catches all errors thrown from routes,
  returns appropriate HTTP code and message based on error type.
  Special handling for Multer errors (file size, etc.)
*/
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File size is too large. Maximum upload size is 100MB'
    });
  }

  // Multer general error (wrong file type, etc.)
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  // Mongoose validation error — form fields filled incorrectly
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: messages.join(', ')
    });
  }

  // Mongoose duplicate key — already registered email or username
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `This ${field} is already in use`
    });
  }

  // Mongoose cast error — invalid ObjectId format
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  // Unknown error
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server error'
  });
};

module.exports = errorHandler;
