const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  getFriendsList,
  assignQuest,
  addFriendByCode,
} = require('../controllers/socialController');

const router = express.Router();

// All social routes require authentication
router.use(authMiddleware);

router.get('/friends', getFriendsList);
router.post('/assign', assignQuest);
router.post('/add-friend', addFriendByCode);

module.exports = router;
