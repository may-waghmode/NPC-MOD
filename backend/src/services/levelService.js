const { db } = require('../firebase/config');
const { getUser, updateUser, querySubCollection, Timestamp } = require('../firebase/firestoreHelpers');

const XP_PER_LEVEL = 500;

/**
 * Add XP to a user and handle level-up logic.
 * Returns { newXP, newLevel, xpToNextLevel, leveledUp }
 */
async function addXP(userId, amount) {
  const user = await getUser(userId);
  if (!user) throw new Error(`User ${userId} not found`);

  let xp = (user.xp || 0) + amount;
  let level = user.level || 1;
  let leveledUp = false;

  // Check for level up (every 500 XP)
  while (xp >= level * XP_PER_LEVEL) {
    xp -= level * XP_PER_LEVEL;
    level += 1;
    leveledUp = true;
  }

  const xpToNextLevel = level * XP_PER_LEVEL - xp;

  await updateUser(userId, { xp, level, xpToNextLevel });

  return { newXP: xp, newLevel: level, xpToNextLevel, leveledUp };
}

/**
 * Pure function: determine if a level up occurs.
 */
function checkLevelUp(currentXP, currentLevel) {
  const threshold = currentLevel * XP_PER_LEVEL;
  if (currentXP >= threshold) {
    return { leveledUp: true, newLevel: currentLevel + 1, remainingXP: currentXP - threshold };
  }
  return { leveledUp: false, newLevel: currentLevel, remainingXP: currentXP };
}

/**
 * Calculate completion rate for a user (completed / total quests).
 */
async function calculateCompletionRate(userId) {
  const allQuests = await querySubCollection(userId, 'quests', {});
  if (allQuests.length === 0) return 0;

  const completed = allQuests.filter((q) => q.status === 'completed').length;
  return Math.round((completed / allQuests.length) * 100);
}

/**
 * Get category stats: strongest category and most avoided category.
 */
async function getCategoryStats(userId) {
  const allQuests = await querySubCollection(userId, 'quests', {});
  const behaviorLogs = await querySubCollection(userId, 'behavior_log', {});

  // Count completions per category
  const completions = {};
  const skips = {};

  for (const quest of allQuests) {
    const cat = quest.category || 'unknown';
    if (quest.status === 'completed') {
      completions[cat] = (completions[cat] || 0) + 1;
    } else if (quest.status === 'skipped') {
      skips[cat] = (skips[cat] || 0) + 1;
    }
  }

  // Also count from behavior_log
  for (const log of behaviorLogs) {
    if (log.eventType === 'quest_skipped' && log.category) {
      skips[log.category] = (skips[log.category] || 0) + 1;
    }
  }

  const strongestCategory = Object.entries(completions).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const mostAvoidedCategory = Object.entries(skips).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  return { strongestCategory, mostAvoidedCategory };
}

/**
 * Update the user's streak. If the user was active yesterday,
 * increment. If they were active today, keep. Otherwise reset to 1.
 */
async function updateStreak(userId) {
  const user = await getUser(userId);
  const now = new Date();
  const today = now.toISOString().slice(0, 10); // 'YYYY-MM-DD'

  let lastActive = null;
  if (user.lastActiveDate) {
    // Handle both Firestore Timestamp objects and plain dates
    const d = user.lastActiveDate.toDate ? user.lastActiveDate.toDate() : new Date(user.lastActiveDate);
    lastActive = d.toISOString().slice(0, 10);
  }

  let streak = user.streak || 0;

  if (lastActive === today) {
    // Already active today — no change
    return streak;
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  if (lastActive === yesterdayStr) {
    streak += 1;
  } else {
    streak = 1; // Reset
  }

  await updateUser(userId, { streak, lastActiveDate: Timestamp.now() });
  return streak;
}

module.exports = {
  addXP,
  checkLevelUp,
  calculateCompletionRate,
  getCategoryStats,
  updateStreak,
  XP_PER_LEVEL,
};
