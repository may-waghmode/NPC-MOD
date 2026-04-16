const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { getMegaQuest, acceptMegaQuest, completeMegaQuest } = require('../controllers/globalController');

const router = express.Router();

// Mega quest is public (no auth needed for GET)
router.get('/mega-quest', getMegaQuest);

// These require auth
router.post('/mega-quest/accept', authMiddleware, acceptMegaQuest);
router.post('/mega-quest/complete', authMiddleware, completeMegaQuest);

module.exports = router;
