const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  getFriendsList,
  assignQuest,
  addFriendByCode,
  acceptAssignedQuest,
} = require('../controllers/socialController');

const router = express.Router();
router.use(authMiddleware);

router.get('/friends', getFriendsList);
router.post('/assign', assignQuest);
router.post('/add-friend', addFriendByCode);
router.post('/accept-quest', acceptAssignedQuest);

module.exports = router;
