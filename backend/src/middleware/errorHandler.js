/**
 * Custom error classes for consistent error handling.
 */
class AppError extends Error {
  constructor(message, code, statusCode) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 'NOT_FOUND', 404);
  }
}

class AuthError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 'AUTH_ERROR', 401);
  }
}

/**
 * Global Express error handler.
 * Catches any error thrown or passed via next(err) and returns
 * a consistent JSON response.
 */
function errorHandler(err, _req, res, _next) {
  console.error('❌ Error:', err.message);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.statusCode ? err.message : 'Something went wrong on the server.';

  res.status(statusCode).json({ error: true, message, code });
}

module.exports = { errorHandler, AppError, ValidationError, NotFoundError, AuthError };
