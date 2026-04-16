const { getUser, updateUser, Timestamp } = require('../firebase/firestoreHelpers');

// ── Level thresholds (cumulative XP) ──────────────────────────
const LEVEL_TABLE = [
  { level: 1,  xp: 0,      title: 'The Awakening' },
  { level: 2,  xp: 500,    title: 'The Initiated' },
  { level: 3,  xp: 1200,   title: 'The Committed One' },
  { level: 4,  xp: 2500,   title: 'The Grinder' },
  { level: 5,  xp: 4500,   title: 'The Challenger' },
  { level: 6,  xp: 7500,   title: 'The Dedicated' },
  { level: 7,  xp: 12000,  title: 'The Relentless' },
  { level: 8,  xp: 18000,  title: 'The Unstoppable' },
  { level: 9,  xp: 26000,  title: 'The Legend' },
  { level: 10, xp: 40000,  title: 'The NPC Who Became The Hero' },
];

/**
 * Get streak multiplier based on current streak.
 */
function getStreakMultiplier(streak) {
  if (streak >= 30) return 1.5;
  if (streak >= 14) return 1.2;
  if (streak >= 7) return 1.1;
  return 1.0;
}

/**
 * Calculate level and title from total XP.
 */
function getLevelFromXP(totalXP) {
  let current = LEVEL_TABLE[0];
  for (const entry of LEVEL_TABLE) {
    if (totalXP >= entry.xp) current = entry;
    else break;
  }
  // Calculate XP to next level
  const nextLevel = LEVEL_TABLE.find(e => e.xp > totalXP);
  const xpToNextLevel = nextLevel ? nextLevel.xp - totalXP : 0;
  return { level: current.level, title: current.title, xpToNextLevel };
}

/**
 * Add XP to a user with streak multiplier.
 * Returns { newXP, newLevel, xpToNextLevel, leveledUp, title, streakMultiplier }
 */
async function addXP(userId, baseXP) {
  const user = await getUser(userId);
  if (!user) throw new Error('User not found');

  const streak = user.streak || 0;
  const multiplier = getStreakMultiplier(streak);
  const earnedXP = Math.round(baseXP * multiplier);
  const newTotalXP = (user.xp || 0) + earnedXP;

  const oldLevel = user.level || 1;
  const { level: newLevel, title, xpToNextLevel } = getLevelFromXP(newTotalXP);
  const leveledUp = newLevel > oldLevel;

  await updateUser(userId, {
    xp: newTotalXP,
    level: newLevel,
    xpToNextLevel,
    title,
    questsCompleted: (user.questsCompleted || 0) + 1,
  });

  return {
    newXP: newTotalXP,
    earnedXP,
    newLevel,
    xpToNextLevel,
    leveledUp,
    title,
    streakMultiplier: multiplier,
  };
}

/**
 * Update daily streak.
 * Called after quest completion.
 */
async function updateStreak(userId) {
  const user = await getUser(userId);
  if (!user) return;

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const lastActive = user.lastActiveDate;

  let lastDate = null;
  if (lastActive) {
    lastDate = lastActive.toDate ? lastActive.toDate().toISOString().slice(0, 10) : new Date(lastActive).toISOString().slice(0, 10);
  }

  if (lastDate === today) {
    // Already active today — no change needed
    return { streak: user.streak || 0, isComeback: false };
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  let newStreak;
  let isComeback = false;

  if (lastDate === yesterdayStr) {
    // Consecutive day — increment streak
    newStreak = (user.streak || 0) + 1;
  } else if (lastDate && lastDate !== today) {
    // Streak broken — restart + comeback bonus
    newStreak = 1;
    isComeback = (user.streak || 0) > 0;
  } else {
    // First activity ever
    newStreak = 1;
  }

  await updateUser(userId, {
    streak: newStreak,
    lastActiveDate: Timestamp.now(),
  });

  return { streak: newStreak, isComeback };
}

module.exports = { addXP, updateStreak, getLevelFromXP, getStreakMultiplier, LEVEL_TABLE };
