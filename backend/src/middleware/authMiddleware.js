const { auth } = require('../firebase/config');

/**
 * Express middleware that verifies a Firebase ID token from the
 * Authorization header (Bearer <token>).
 *
 * On success, attaches `req.userId` and `req.firebaseUser` to the request.
 * On failure, responds with 401 Unauthorized.
 */
async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({
        error: true,
        message: 'Missing or malformed Authorization header. Expected "Bearer <token>".',
        code: 'AUTH_MISSING_TOKEN',
      });
    }

    const idToken = header.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);

    req.userId = decodedToken.uid;
    req.firebaseUser = decodedToken;

    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return res.status(401).json({
      error: true,
      message: 'Invalid or expired token.',
      code: 'AUTH_INVALID_TOKEN',
    });
  }
}

module.exports = { authMiddleware };
