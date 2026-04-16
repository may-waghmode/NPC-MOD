const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  getDailyQuests,
  completeQuest,
  skipQuest,
  getHistory,
} = require('../controllers/questController');

const router = express.Router();
router.use(authMiddleware);

router.get('/daily', getDailyQuests);
router.post('/complete', completeQuest);
router.post('/skip', skipQuest);
router.get('/history', getHistory);

module.exports = router;
