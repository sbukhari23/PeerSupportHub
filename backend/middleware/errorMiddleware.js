// Custom error handler middleware
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error:', err.stack);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      msg: `Resource not found with id: ${err.value}`,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      msg: `${field} already exists. Please use a different ${field}.`,
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((error) => error.message);
    return res.status(400).json({
      success: false,
      msg: messages.join(', '),
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      msg: 'Invalid token. Please log in again.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      msg: 'Your session has expired. Please log in again.',
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    msg: err.message || 'Server Error',
  });
};

// 404 handler for undefined routes
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    msg: `Route ${req.originalUrl} not found`,
  });
};

module.exports = { errorHandler, notFound };
