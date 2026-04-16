const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { onboarding, getStats, updateProfile, getNotifications, markNotificationsRead } = require('../controllers/playerController');

const router = express.Router();
router.use(authMiddleware);

router.post('/onboarding', onboarding);
router.get('/stats', getStats);
router.put('/profile', updateProfile);
router.get('/notifications', getNotifications);
router.post('/notifications/read', markNotificationsRead);

module.exports = router;
