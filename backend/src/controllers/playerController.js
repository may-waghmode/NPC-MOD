const {
  getUser,
  updateUser,
  querySubCollection,
  Timestamp,
} = require('../firebase/firestoreHelpers');
const { generateTagline } = require('../services/aiService');
const { getLevelFromXP, LEVEL_TABLE } = require('../services/levelService');
const redis = require('../services/redisService');
const { ValidationError } = require('../middleware/errorHandler');

/**
 * POST /api/player/onboarding
 */
async function onboarding(req, res, next) {
  try {
    const { userId } = req;
    const {
      name,
      class: playerClass,
      goals,
      avoidanceAnswer,
      personalityType,
      energyPeak,
      motivationStyle,
    } = req.body;

    if (!playerClass) throw new ValidationError('class is required.');
    if (!goals || !Array.isArray(goals) || goals.length === 0) {
      throw new ValidationError('goals array is required (at least 1 goal).');
    }

    // Check if user already has a friend code; if not, generate one
    const existingUser = await getUser(userId);
    let friendCode = existingUser?.friendCode || '';
    if (!friendCode) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      for (let i = 0; i < 6; i++) {
        friendCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }

    const profileData = {
      name: (name && name.trim()) || existingUser?.name || 'Adventurer',
      class: playerClass,
      goals,
      avoidanceAnswer: avoidanceAnswer || '',
      personalityType: personalityType || 'ambivert',
      energyPeak: energyPeak || 'morning',
      motivationStyle: motivationStyle || 'curiosity',
      onboardingComplete: true,
      title: LEVEL_TABLE[0].title,
      friendCode,
    };

    // Generate AI tagline
    const tagline = await generateTagline({ ...profileData });
    profileData.tagline = tagline;

    await updateUser(userId, profileData);

    // Invalidate ALL caches so quests generate immediately
    await redis.del(`stats:${userId}`);
    await redis.del(`quests:${userId}`);

    res.json({
      success: true,
      tagline,
      friendCode,
      profile: profileData,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/player/stats
 */
async function getStats(req, res, next) {
  try {
    const { userId } = req;

    // Check cache (short TTL)
    const cacheKey = `stats:${userId}`;
    const cached = await redis.get(cacheKey);
    if (cached) return res.json(cached);

    const user = await getUser(userId);
    if (!user) {
      return res.status(404).json({ error: true, message: 'User not found', code: 'NOT_FOUND' });
    }

    // Get behavior log
    const behaviorLog = await querySubCollection(userId, 'behavior_log', {
      orderBy: 'timestamp',
      direction: 'desc',
      limit: 100,
    });

    // Calculate category stats
    const categoryStats = {};
    let totalCompleted = 0;
    let totalSkipped = 0;

    for (const entry of behaviorLog) {
      const cat = entry.category || 'unknown';
      if (!categoryStats[cat]) categoryStats[cat] = { completed: 0, skipped: 0 };
      if (entry.eventType === 'quest_completed') {
        categoryStats[cat].completed++;
        totalCompleted++;
      }
      if (entry.eventType === 'quest_skipped') {
        categoryStats[cat].skipped++;
        totalSkipped++;
      }
    }

    const completionRate = totalCompleted + totalSkipped > 0
      ? Math.round((totalCompleted / (totalCompleted + totalSkipped)) * 100)
      : 0;

    // Strongest / most avoided
    let strongestCategory = null;
    let mostAvoidedCategory = null;
    let maxCompleted = 0;
    let maxSkipped = 0;

    for (const [cat, stats] of Object.entries(categoryStats)) {
      if (cat === 'unknown' || cat === 'boss') continue;
      if (stats.completed > maxCompleted) { maxCompleted = stats.completed; strongestCategory = cat; }
      if (stats.skipped > maxSkipped) { maxSkipped = stats.skipped; mostAvoidedCategory = cat; }
    }

    // Weekly XP
    const now = new Date();
    const weeklyXP = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString('en', { weekday: 'short' });

      let dayXP = 0;
      for (const e of behaviorLog) {
        if (e.eventType !== 'quest_completed' || !e.timestamp) continue;
        const ts = e.timestamp.toDate ? e.timestamp.toDate() : new Date(e.timestamp);
        if (ts.toISOString().slice(0, 10) === dateStr) {
          dayXP += e.xpEarned || 50;
        }
      }

      weeklyXP.push({ day: dayLabel, date: dateStr, xp: dayXP });
    }

    const { xpToNextLevel } = getLevelFromXP(user.xp || 0);

    const stats = {
      name: user.name || 'Adventurer',
      level: user.level || 1,
      xp: user.xp || 0,
      xpToNextLevel,
      title: user.title || LEVEL_TABLE[0].title,
      class: user.class || 'Explorer',
      streak: user.streak || 0,
      questsCompleted: user.questsCompleted || 0,
      completionRate,
      strongestCategory,
      mostAvoidedCategory,
      categoryStats,
      weeklyXP,
      tagline: user.tagline || '',
      villainModeActive: user.villainModeActive || false,
      avoidancePatterns: user.avoidancePatterns || [],
      goals: user.goals || [],
      friendCode: user.friendCode || '',
      onboardingComplete: user.onboardingComplete || false,
    };

    // Cache for 2 minutes
    await redis.set(cacheKey, stats, 120);

    res.json(stats);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/player/profile
 */
async function updateProfile(req, res, next) {
  try {
    const { userId } = req;
    const allowedFields = ['goals', 'personalityType', 'energyPeak', 'motivationStyle', 'name'];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new ValidationError('No valid fields to update.');
    }

    await updateUser(userId, updates);
    await redis.del(`stats:${userId}`);

    res.json({ success: true, updated: Object.keys(updates) });
  } catch (err) {
    next(err);
  }
}

module.exports = { onboarding, getStats, updateProfile };
