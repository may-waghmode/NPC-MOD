const {
  getUser,
  updateUser,
  addFriend,
  getFriends,
  addSubDoc,
  Timestamp,
} = require('../firebase/firestoreHelpers');
const { db } = require('../firebase/config');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');

/**
 * GET /api/social/friends
 */
async function getFriendsList(req, res, next) {
  try {
    const { userId } = req;
    const friendDocs = await getFriends(userId);

    // Enrich with user data
    const friends = [];
    for (const doc of friendDocs) {
      const friendUser = await getUser(doc.id);
      if (friendUser) {
        friends.push({
          friendId: doc.id,
          name: friendUser.name || 'Adventurer',
          level: friendUser.level || 1,
          class: friendUser.class || 'Explorer',
          streak: friendUser.streak || 0,
          xp: friendUser.xp || 0,
          title: friendUser.title || 'The Awakening',
        });
      }
    }

    res.json({ friends });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/social/add-friend
 */
async function addFriendByCode(req, res, next) {
  try {
    const { userId } = req;
    const { friendCode } = req.body;

    if (!friendCode) throw new ValidationError('friendCode is required.');

    // Find user by friend code
    const snapshot = await db.collection('users')
      .where('friendCode', '==', friendCode.toUpperCase())
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new NotFoundError('No player found with that friend code.');
    }

    const friendDoc = snapshot.docs[0];
    const friendId = friendDoc.id;

    if (friendId === userId) {
      throw new ValidationError('You can\'t add yourself as a friend!');
    }

    // Check if already friends
    const existingFriends = await getFriends(userId);
    if (existingFriends.some(f => f.id === friendId)) {
      throw new ValidationError('You\'re already friends with this player.');
    }

    // Add friend (bidirectional)
    await addFriend(userId, friendId, { status: 'accepted' });
    await addFriend(friendId, userId, { status: 'accepted' });

    const friendUser = await getUser(friendId);

    res.json({
      success: true,
      friend: {
        friendId,
        name: friendUser.name || 'Adventurer',
        level: friendUser.level || 1,
        class: friendUser.class || 'Explorer',
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/social/assign
 * Challenge a friend with a quest. Sender sets custom XP reward.
 * When the friend completes the quest, they earn the XP and the sender loses it.
 */
async function assignQuest(req, res, next) {
  try {
    const { userId } = req;
    const { friendId, questTitle, questDescription, xpReward, category } = req.body;

    if (!friendId) throw new ValidationError('friendId is required.');
    if (!questTitle) throw new ValidationError('questTitle is required.');

    const rewardAmount = Math.max(10, Math.min(500, parseInt(xpReward) || 50));

    // Verify friendship
    const friends = await getFriends(userId);
    if (!friends.some(f => f.id === friendId)) {
      throw new ValidationError('You can only assign quests to friends.');
    }

    // Validate sender has enough XP
    const senderUser = await getUser(userId);
    if ((senderUser.xp || 0) < rewardAmount) {
      throw new ValidationError(`Not enough XP! You have ${senderUser.xp || 0} XP but trying to wager ${rewardAmount} XP.`);
    }

    // Add quest to friend's quests subcollection
    const questId = await addSubDoc(friendId, 'quests', {
      title: questTitle,
      description: questDescription || `A challenge from ${senderUser.name || 'a friend'}!`,
      category: category || 'social',
      xp_reward: rewardAmount,
      challengeXpReward: rewardAmount, // Store the wagered XP amount
      difficulty: 'medium',
      status: 'pending', // Friend must accept
      assignedBy: userId,
      assignedByName: senderUser.name || 'A Friend',
      proof_type: 'photo', // All challenges require photo proof
      proof_instructions: 'Take a photo as proof that you completed this challenge!',
      estimated_minutes: 30,
      why_it_helps: `Your friend ${senderUser.name || 'someone'} wagered ${rewardAmount} XP on you. Don\'t let them down!`,
    });

    // Notify the friend
    await addSubDoc(friendId, 'notifications', {
      type: 'challenge_received',
      fromUserId: userId,
      fromName: senderUser.name || 'A Friend',
      questTitle,
      xpReward: rewardAmount,
      message: `challenged you with "${questTitle}" for ${rewardAmount} XP!`,
      read: false,
      createdAt: Timestamp.now(),
    });

    res.json({
      success: true,
      questId,
      xpWagered: rewardAmount,
      message: `Challenge sent! ${rewardAmount} XP wagered.`,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/social/accept-quest
 */
async function acceptAssignedQuest(req, res, next) {
  try {
    const { userId } = req;
    const { questId } = req.body;

    if (!questId) throw new ValidationError('questId is required.');

    const { getSubDoc, updateSubDoc } = require('../firebase/firestoreHelpers');

    // Check current status to prevent double-accept
    const quest = await getSubDoc(userId, 'quests', questId);
    if (!quest) throw new NotFoundError('Quest not found.');

    if (quest.status === 'active') {
      return res.json({ success: true, message: 'Quest already accepted.' });
    }

    if (quest.status !== 'pending') {
      throw new ValidationError('This quest cannot be accepted (status: ' + quest.status + ').');
    }

    await updateSubDoc(userId, 'quests', questId, {
      status: 'active',
      acceptedAt: Timestamp.now(),
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { getFriendsList, addFriendByCode, assignQuest, acceptAssignedQuest };
