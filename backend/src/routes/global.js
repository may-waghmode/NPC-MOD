const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { getMegaQuest, acceptMegaQuest, completeMegaQuest } = require('../controllers/globalController');
const { getPublicLeaderboard, getFriendsLeaderboard } = require('../controllers/leaderboardController');

const router = express.Router();

// Mega quest is public (no auth needed for GET)
router.get('/mega-quest', getMegaQuest);

// Leaderboard — public
router.get('/leaderboard', getPublicLeaderboard);

// Leaderboard — friends (requires auth)
router.get('/leaderboard/friends', authMiddleware, getFriendsLeaderboard);

// These require auth
router.post('/mega-quest/accept', authMiddleware, acceptMegaQuest);
router.post('/mega-quest/complete', authMiddleware, completeMegaQuest);

module.exports = router;
