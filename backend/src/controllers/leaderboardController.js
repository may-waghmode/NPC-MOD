const { db } = require('../firebase/config');
const { getUser, getFriends } = require('../firebase/firestoreHelpers');

const CLASS_EMOJIS = { Warrior: '⚔️', Scholar: '📚', Social: '🗣️', Explorer: '🧭' };

function formatUser(doc, rank, isYou = false) {
  const u = doc.data ? doc.data() : doc;
  return {
    rank,
    userId: doc.id || doc.userId,
    name: u.name || 'Adventurer',
    level: u.level || 1,
    xp: u.xp || 0,
    class: u.class || 'Explorer',
    classEmoji: CLASS_EMOJIS[u.class] || '🧭',
    streak: u.streak || 0,
    title: u.title || 'The Awakening',
    questsCompleted: u.questsCompleted || 0,
    isYou,
  };
}

/**
 * GET /api/global/leaderboard
 * Local rank — shows user's rank + 25 users above/below them.
 * If no auth, returns top 50.
 */
async function getPublicLeaderboard(req, res, next) {
  try {
    // Get ALL onboarded users sorted by XP
    const snapshot = await db.collection('users')
      .where('onboardingComplete', '==', true)
      .orderBy('xp', 'desc')
      .limit(200)
      .get();

    const allUsers = [];
    let rank = 1;
    for (const doc of snapshot.docs) {
      allUsers.push({ ...formatUser(doc, rank), docId: doc.id });
      rank++;
    }

    // If user is authenticated, show nearby ranks
    const userId = req.userId; // May be undefined for public access
    if (userId) {
      const userIndex = allUsers.findIndex(u => u.docId === userId);

      if (userIndex >= 0) {
        // Mark the user
        allUsers[userIndex].isYou = true;
        const userRank = allUsers[userIndex].rank;

        // Get 25 above and 25 below
        const start = Math.max(0, userIndex - 25);
        const end = Math.min(allUsers.length, userIndex + 26);
        const nearbyUsers = allUsers.slice(start, end);

        // Clean up docId before sending
        const leaderboard = nearbyUsers.map(({ docId, ...rest }) => rest);

        return res.json({
          leaderboard,
          total: allUsers.length,
          yourRank: userRank,
          yourXP: allUsers[userIndex].xp,
        });
      }
    }

    // Fallback: return top 50
    const leaderboard = allUsers.slice(0, 50).map(({ docId, ...rest }) => rest);
    res.json({ leaderboard, total: allUsers.length });
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

    entries.sort((a, b) => b.xp - a.xp);
    const leaderboard = entries.map((entry, i) => ({ ...entry, rank: i + 1 }));

    res.json({ leaderboard, total: leaderboard.length });
  } catch (err) {
    next(err);
  }
}

module.exports = { getPublicLeaderboard, getFriendsLeaderboard };
