const express = require('express');
const { auth, db } = require('../firebase/config');
const { getUser, setUser, Timestamp } = require('../firebase/firestoreHelpers');

const router = express.Router();

/**
 * POST /api/auth/verify
 *
 * Verify a Firebase ID token. If the user doesn't exist yet in
 * Firestore (first login), create a skeleton user document.
 *
 * Body: { idToken: string }
 * Returns: { userId, isNewUser, name }
 */
router.post('/verify', async (req, res, next) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        error: true,
        message: 'idToken is required in request body.',
        code: 'MISSING_TOKEN',
      });
    }

    // Verify the token with Firebase Auth
    const decodedToken = await auth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Check if user doc exists
    const existingUser = await getUser(userId);
    let isNewUser = false;

    if (!existingUser) {
      // First login — create skeleton user document
      isNewUser = true;

      // Generate a unique friend code
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let friendCode = '';
      for (let i = 0; i < 6; i++) {
        friendCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      await setUser(userId, {
        name: decodedToken.name || decodedToken.email || 'Adventurer',
        level: 1,
        xp: 0,
        xpToNextLevel: 500,
        class: null, // Set during onboarding
        goals: [],
        avoidancePatterns: [],
        onboardingAnswers: null,
        friendCode,
        skipCounts: {},
        streak: 0,
        lastActiveDate: Timestamp.now(),
        createdAt: Timestamp.now(),
      });
    }

    // Check if user completed onboarding
    const needsOnboarding = isNewUser || (existingUser && !existingUser.onboardingComplete);

    res.json({
      userId,
      isNewUser: needsOnboarding,
      name: existingUser?.name || decodedToken.name || 'Adventurer',
      onboardingComplete: existingUser?.onboardingComplete || false,
    });
  } catch (err) {
    if (err.code === 'auth/id-token-expired' || err.code === 'auth/argument-error') {
      return res.status(401).json({
        error: true,
        message: 'Invalid or expired token.',
        code: 'AUTH_INVALID_TOKEN',
      });
    }
    next(err);
  }
});

module.exports = router;
