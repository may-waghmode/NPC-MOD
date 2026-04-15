const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { onboarding, getStats } = require('../controllers/playerController');

const router = express.Router();

// All player routes require authentication
router.use(authMiddleware);

router.post('/onboarding', onboarding);
router.get('/stats', getStats);

module.exports = router;
