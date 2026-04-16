const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { onboarding, getStats, updateProfile } = require('../controllers/playerController');

const router = express.Router();
router.use(authMiddleware);

router.post('/onboarding', onboarding);
router.get('/stats', getStats);
router.put('/profile', updateProfile);

module.exports = router;
