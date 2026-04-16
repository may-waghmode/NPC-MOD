const { db } = require('../firebase/config');
const { getUser, getFriends } = require('../firebase/firestoreHelpers');

const CLASS_EMOJIS = { Warrior: '⚔️', Scholar: '📚', Social: '🗣️', Explorer: '🧭' };

/**
 * GET /api/global/leaderboard
 * Public leaderboard — top 50 users by XP.
 */
async function getPublicLeaderboard(req, res, next) {
  try {
    const snapshot = await db.collection('users')
      .where('onboardingComplete', '==', true)
      .orderBy('xp', 'desc')
      .limit(50)
      .get();

    const leaderboard = [];
    let rank = 1;
    for (const doc of snapshot.docs) {
      const u = doc.data();
      leaderboard.push({
        rank,
        userId: doc.id,
        name: u.name || 'Adventurer',
        level: u.level || 1,
        xp: u.xp || 0,
        class: u.class || 'Explorer',
        classEmoji: CLASS_EMOJIS[u.class] || '🧭',
        streak: u.streak || 0,
        title: u.title || 'The Awakening',
        questsCompleted: u.questsCompleted || 0,
      });
      rank++;
    }

    res.json({ leaderboard, total: leaderboard.length });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/global/leaderboard/friends
 * Friends leaderboard — current user + their friends, sorted by XP.
 */
async function getFriendsLeaderboard(req, res, next) {
  try {
    const { userId } = req;

    // Get current user
    const currentUser = await getUser(userId);
    const entries = [];

    if (currentUser) {
      entries.push({
        userId,
        name: currentUser.name || 'Adventurer',
        level: currentUser.level || 1,
        xp: currentUser.xp || 0,
        class: currentUser.class || 'Explorer',
        classEmoji: CLASS_EMOJIS[currentUser.class] || '🧭',
        streak: currentUser.streak || 0,
        title: currentUser.title || 'The Awakening',
        questsCompleted: currentUser.questsCompleted || 0,
        isYou: true,
      });
    }

    // Get friends
    const friendDocs = await getFriends(userId);
    for (const doc of friendDocs) {
      const friendUser = await getUser(doc.id);
      if (friendUser) {
        entries.push({
          userId: doc.id,
          name: friendUser.name || 'Adventurer',
          level: friendUser.level || 1,
          xp: friendUser.xp || 0,
          class: friendUser.class || 'Explorer',
          classEmoji: CLASS_EMOJIS[friendUser.class] || '🧭',
          streak: friendUser.streak || 0,
          title: friendUser.title || 'The Awakening',
          questsCompleted: friendUser.questsCompleted || 0,
          isYou: false,
        });
      }
    }

    // Sort by XP descending
    entries.sort((a, b) => b.xp - a.xp);

    // Assign ranks
    const leaderboard = entries.map((entry, i) => ({ ...entry, rank: i + 1 }));

    res.json({ leaderboard, total: leaderboard.length });
  } catch (err) {
    next(err);
  }
}

module.exports = { getPublicLeaderboard, getFriendsLeaderboard };
