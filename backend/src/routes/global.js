const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { getMegaQuest, acceptMegaQuest, completeMegaQuest } = require('../controllers/globalController');
const { getPublicLeaderboard, getFriendsLeaderboard } = require('../controllers/leaderboardController');

const router = express.Router();

// Optional auth — sets req.userId if token present, doesn't block if not
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const { auth } = require('../firebase/config');
      const token = authHeader.split(' ')[1];
      const decoded = await auth.verifyIdToken(token);
      req.userId = decoded.uid;
    } catch (e) { /* ignore — just proceed without userId */ }
  }
  next();
};

// Mega quest — optional auth so we can check if user already accepted
router.get('/mega-quest', optionalAuth, getMegaQuest);

// Leaderboard — public (optional auth for nearby rank)
router.get('/leaderboard', optionalAuth, getPublicLeaderboard);

// Leaderboard — friends (requires auth)
router.get('/leaderboard/friends', authMiddleware, getFriendsLeaderboard);

// These require auth
router.post('/mega-quest/accept', authMiddleware, acceptMegaQuest);
router.post('/mega-quest/complete', authMiddleware, completeMegaQuest);

module.exports = router;
