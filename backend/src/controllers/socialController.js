const { db } = require('../firebase/config');
const {
  getUser,
  addSubDoc,
  addFriend,
  getFriends,
  updateFriend,
  querySubCollection,
  Timestamp,
} = require('../firebase/firestoreHelpers');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');

/**
 * GET /api/social/friends
 *
 * Returns friends list with their current level, active quest, and streak.
 */
async function getFriendsList(req, res, next) {
  try {
    const { userId } = req;

    const friends = await getFriends(userId);
    const accepted = friends.filter((f) => f.status === 'accepted');

    // Enrich each friend with profile data
    const enriched = await Promise.all(
      accepted.map(async (friend) => {
        const friendUser = await getUser(friend.id);
        if (!friendUser) return null;

        // Get their most recent active quest
        const activeQuests = await querySubCollection(friend.id, 'quests', {
          where: { field: 'status', op: '==', value: 'active' },
          orderBy: 'createdAt',
          direction: 'desc',
          limit: 1,
        });

        return {
          friendId: friend.id,
          name: friendUser.name,
          level: friendUser.level || 1,
          class: friendUser.class || 'Explorer',
          streak: friendUser.streak || 0,
          activeQuest: activeQuests[0]?.title || null,
        };
      })
    );

    res.json({ friends: enriched.filter(Boolean) });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/social/assign
 *
 * Assign a quest to a friend.
 */
async function assignQuest(req, res, next) {
  try {
    const { userId } = req;
    const { friendId, questTitle, questDescription, xpReward } = req.body;

    if (!friendId || !questTitle) {
      throw new ValidationError('friendId and questTitle are required.');
    }

    // Verify friendship exists
    const friends = await getFriends(userId);
    const isFriend = friends.some((f) => f.id === friendId && f.status === 'accepted');
    if (!isFriend) {
      throw new ValidationError('You can only assign quests to accepted friends.');
    }

    // Create quest in friend's subcollection
    const questId = await addSubDoc(friendId, 'quests', {
      title: questTitle,
      description: questDescription || '',
      category: 'social',
      xpReward: Math.min(xpReward || 50, 200), // Cap at 200 XP
      status: 'active',
      assignedBy: userId,
      whyItHelps: 'Your friend thought this would be good for you!',
    });

    // Get assigner's name for the response
    const assigner = await getUser(userId);

    res.json({
      success: true,
      questId,
      message: `Quest assigned to your friend by ${assigner?.name || 'you'}.`,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/social/add-friend
 *
 * Add a friend by their friend code.
 */
async function addFriendByCode(req, res, next) {
  try {
    const { userId } = req;
    const { friendCode } = req.body;

    if (!friendCode) {
      throw new ValidationError('friendCode is required.');
    }

    // Look up user by friendCode
    const usersSnapshot = await db
      .collection('users')
      .where('friendCode', '==', friendCode.toUpperCase())
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      throw new NotFoundError('No user found with that friend code.');
    }

    const friendDoc = usersSnapshot.docs[0];
    const friendId = friendDoc.id;

    if (friendId === userId) {
      throw new ValidationError("You can't add yourself as a friend.");
    }

    // Check if already friends
    const existingFriends = await getFriends(userId);
    const alreadyFriends = existingFriends.some((f) => f.id === friendId);
    if (alreadyFriends) {
      return res.json({ success: true, message: 'Already friends!', friendName: friendDoc.data().name });
    }

    // Create bidirectional friend docs
    // Current user → pending (they initiated)
    await addFriend(userId, friendId, {
      friendId,
      status: 'accepted', // auto-accept for hackathon simplicity
    });

    // Friend → accepted (they receive)
    await addFriend(friendId, userId, {
      friendId: userId,
      status: 'accepted',
    });

    res.json({
      success: true,
      friendName: friendDoc.data().name,
      friendLevel: friendDoc.data().level || 1,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getFriendsList, assignQuest, addFriendByCode };
