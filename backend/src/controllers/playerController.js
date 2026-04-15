const {
  getUser,
  setUser,
  updateUser,
  querySubCollection,
  Timestamp,
} = require('../firebase/firestoreHelpers');
const { generateBehaviorProfile, generateQuests } = require('../services/aiEngineService');
const { calculateCompletionRate, getCategoryStats, XP_PER_LEVEL } = require('../services/levelService');
const redis = require('../services/redisService');
const { ValidationError } = require('../middleware/errorHandler');

const STATS_CACHE_TTL = 30 * 60; // 30 minutes

/**
 * Generate a random 6-character alphanumeric friend code.
 */
function generateFriendCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars (0, O, 1, I)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * POST /api/player/onboarding
 */
async function onboarding(req, res, next) {
  try {
    const { userId } = req;
    const { answers, class: playerClass, goals } = req.body;

    if (!answers || !playerClass || !goals) {
      throw new ValidationError('answers, class, and goals are required.');
    }

    const validClasses = ['Warrior', 'Scholar', 'Social', 'Explorer'];
    if (!validClasses.includes(playerClass)) {
      throw new ValidationError(`class must be one of: ${validClasses.join(', ')}`);
    }

    // 1. Generate initial behavior profile from AI
    const behaviorProfile = await generateBehaviorProfile(answers);

    // 2. Save user document
    await setUser(userId, {
      name: req.firebaseUser?.name || answers.name || 'Adventurer',
      level: 1,
      xp: 0,
      xpToNextLevel: XP_PER_LEVEL,
      class: playerClass,
      goals: goals,
      avoidancePatterns: behaviorProfile.avoidancePatterns || [],
      onboardingAnswers: answers,
      friendCode: generateFriendCode(),
      skipCounts: {},
      streak: 0,
      lastActiveDate: Timestamp.now(),
      createdAt: Timestamp.now(),
    });

    // 3. Generate first quests
    const userProfile = await getUser(userId);
    const { quests, bossBattle } = await generateQuests(userProfile, [], {});

    // Save quests to Firestore
    const savedQuests = [];
    const { addSubDoc } = require('../firebase/firestoreHelpers');
    for (const quest of quests) {
      const id = await addSubDoc(userId, 'quests', {
        ...quest,
        status: 'active',
        assignedBy: 'self',
      });
      savedQuests.push({ id, ...quest, status: 'active' });
    }

    const bossId = await addSubDoc(userId, 'quests', {
      ...bossBattle,
      status: 'active',
      assignedBy: 'system',
    });
    const savedBoss = { id: bossId, ...bossBattle, status: 'active' };

    // Cache the new quests
    await redis.set(`quests:${userId}`, { quests: savedQuests, bossBattle: savedBoss }, 6 * 60 * 60);

    res.json({
      success: true,
      firstQuests: savedQuests,
      bossBattle: savedBoss,
      class: playerClass,
      level: 1,
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

    // 1. Check cache
    const cacheKey = `stats:${userId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    // 2. Get user doc
    const user = await getUser(userId);
    if (!user) {
      return res.status(404).json({ error: true, message: 'User not found', code: 'USER_NOT_FOUND' });
    }

    // 3. Calculate stats
    const completionRate = await calculateCompletionRate(userId);
    const { strongestCategory, mostAvoidedCategory } = await getCategoryStats(userId);

    const allQuests = await querySubCollection(userId, 'quests', {});
    const totalQuestsCompleted = allQuests.filter((q) => q.status === 'completed').length;

    const stats = {
      name: user.name,
      level: user.level || 1,
      xp: user.xp || 0,
      xpToNextLevel: user.xpToNextLevel || XP_PER_LEVEL,
      streak: user.streak || 0,
      class: user.class || 'Explorer',
      completionRate,
      mostAvoidedCategory,
      strongestCategory,
      totalQuestsCompleted,
    };

    // 4. Cache for 30 minutes
    await redis.set(cacheKey, stats, STATS_CACHE_TTL);

    res.json(stats);
  } catch (err) {
    next(err);
  }
}

module.exports = { onboarding, getStats };
