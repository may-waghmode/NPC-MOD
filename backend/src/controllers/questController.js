const { v4: uuidv4 } = require('uuid');
const {
  getUser,
  updateUser,
  addSubDoc,
  getSubDoc,
  updateSubDoc,
  querySubCollection,
  Timestamp,
} = require('../firebase/firestoreHelpers');
const { addXP, updateStreak } = require('../services/levelService');
const { generateQuests } = require('../services/aiEngineService');
const redis = require('../services/redisService');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');

const QUEST_CACHE_TTL = 6 * 60 * 60; // 6 hours in seconds

// ── Hidden quest trigger rules ─────────────────────────────────
const HIDDEN_QUEST_TRIGGERS = [
  {
    id: 'category_master',
    check: async (userId, completedQuest) => {
      // Complete 3 quests in the same category → unlock hidden quest
      const quests = await querySubCollection(userId, 'quests', {
        where: { field: 'status', op: '==', value: 'completed' },
      });
      const sameCat = quests.filter((q) => q.category === completedQuest.category);
      return sameCat.length >= 3 && sameCat.length % 3 === 0; // every 3rd
    },
    quest: (category) => ({
      title: `🔮 Hidden Quest: ${category.charAt(0).toUpperCase() + category.slice(1)} Mastery`,
      description: `You've been crushing ${category} quests! Here's a bonus challenge to push even further.`,
      category,
      xpReward: 100,
      status: 'active',
      assignedBy: 'system',
      whyItHelps: 'Bonus quests reward consistency and deepen your growth in areas you excel.',
    }),
  },
  {
    id: 'daily_sweep',
    check: async (userId) => {
      // Check if all daily quests are completed
      const today = new Date().toISOString().slice(0, 10);
      const todayQuests = await querySubCollection(userId, 'quests', {
        orderBy: 'createdAt',
        direction: 'desc',
        limit: 4, // 3 dailies + 1 boss
      });
      const todayActive = todayQuests.filter((q) => {
        if (!q.createdAt) return false;
        const d = q.createdAt.toDate ? q.createdAt.toDate() : new Date(q.createdAt);
        return d.toISOString().slice(0, 10) === today;
      });
      return todayActive.length > 0 && todayActive.every((q) => q.status === 'completed');
    },
    quest: () => ({
      title: '⚡ Daily Sweep Bonus',
      description: 'You completed ALL quests today! Take a victory lap with this bonus XP quest.',
      category: 'boss',
      xpReward: 75,
      status: 'active',
      assignedBy: 'system',
      whyItHelps: 'Completing everything builds unstoppable momentum.',
    }),
  },
];

/**
 * GET /api/quests/daily
 */
async function getDailyQuests(req, res, next) {
  try {
    const { userId } = req;

    // 1. Check Redis cache
    const cacheKey = `quests:${userId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({ quests: cached.quests, bossBattle: cached.bossBattle, cached: true });
    }

    // 2. Gather user profile and behavior log for AI
    const userProfile = await getUser(userId);
    const behaviorLog = await querySubCollection(userId, 'behavior_log', {
      orderBy: 'timestamp',
      direction: 'desc',
      limit: 50,
    });

    // 3. Call AI engine
    const { quests, bossBattle } = await generateQuests(userProfile, behaviorLog, {});

    // 4. Save quests to Firestore
    const savedQuests = [];
    for (const quest of quests) {
      const id = await addSubDoc(userId, 'quests', {
        ...quest,
        status: 'active',
        assignedBy: 'self',
      });
      savedQuests.push({ id, ...quest, status: 'active', assignedBy: 'self' });
    }

    // Save boss battle
    const bossId = await addSubDoc(userId, 'quests', {
      ...bossBattle,
      status: 'active',
      assignedBy: 'system',
    });
    const savedBoss = { id: bossId, ...bossBattle, status: 'active', assignedBy: 'system' };

    // 5. Cache for 6 hours
    const cachePayload = { quests: savedQuests, bossBattle: savedBoss };
    await redis.set(cacheKey, cachePayload, QUEST_CACHE_TTL);

    res.json({ quests: savedQuests, bossBattle: savedBoss, cached: false });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/quests/complete
 */
async function completeQuest(req, res, next) {
  try {
    const { userId } = req;
    const { questId, proof } = req.body;

    if (!questId) throw new ValidationError('questId is required.');

    // 1. Get the quest
    const quest = await getSubDoc(userId, 'quests', questId);
    if (!quest) throw new NotFoundError('Quest not found.');
    if (quest.status === 'completed') {
      return res.json({ message: 'Quest already completed', newXP: 0, leveledUp: false });
    }

    // 2. Update quest status
    const updateData = { status: 'completed', completedAt: Timestamp.now() };
    if (proof) updateData.proof = proof;
    await updateSubDoc(userId, 'quests', questId, updateData);

    // 3. Add XP
    const xpResult = await addXP(userId, quest.xpReward || 50);

    // 4. Update streak
    await updateStreak(userId);

    // 5. Log behavior event
    await addSubDoc(userId, 'behavior_log', {
      eventType: 'quest_completed',
      category: quest.category || 'unknown',
      questId,
      timestamp: Timestamp.now(),
    });

    // 6. Check hidden quest triggers
    let hiddenQuestUnlocked = null;
    for (const trigger of HIDDEN_QUEST_TRIGGERS) {
      const triggered = await trigger.check(userId, quest);
      if (triggered) {
        const hiddenQuest = trigger.quest(quest.category);
        const hiddenId = await addSubDoc(userId, 'quests', hiddenQuest);
        hiddenQuestUnlocked = { id: hiddenId, ...hiddenQuest };
        break; // Only one hidden quest per completion
      }
    }

    // 7. Invalidate caches
    await redis.del(`quests:${userId}`);
    await redis.del(`stats:${userId}`);

    res.json({
      newXP: xpResult.newXP,
      newLevel: xpResult.newLevel,
      xpToNextLevel: xpResult.xpToNextLevel,
      leveledUp: xpResult.leveledUp,
      hiddenQuestUnlocked: hiddenQuestUnlocked || undefined,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/quests/skip
 */
async function skipQuest(req, res, next) {
  try {
    const { userId } = req;
    const { questId } = req.body;

    if (!questId) throw new ValidationError('questId is required.');

    const quest = await getSubDoc(userId, 'quests', questId);
    if (!quest) throw new NotFoundError('Quest not found.');

    // 1. Update quest status
    await updateSubDoc(userId, 'quests', questId, { status: 'skipped' });

    // 2. Log behavior event
    await addSubDoc(userId, 'behavior_log', {
      eventType: 'quest_skipped',
      category: quest.category || 'unknown',
      questId,
      timestamp: Timestamp.now(),
    });

    // 3. Update skip count for this category on user profile
    const user = await getUser(userId);
    const skipCounts = user.skipCounts || {};
    const cat = quest.category || 'unknown';
    skipCounts[cat] = (skipCounts[cat] || 0) + 1;

    // Detect avoidance patterns (category skipped 3+ times)
    const avoidancePatterns = Object.entries(skipCounts)
      .filter(([, count]) => count >= 3)
      .map(([category]) => category);

    await updateUser(userId, { skipCounts, avoidancePatterns });

    // 4. Invalidate caches
    await redis.del(`quests:${userId}`);
    await redis.del(`stats:${userId}`);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/quests/history
 */
async function getHistory(req, res, next) {
  try {
    const { userId } = req;

    const quests = await querySubCollection(userId, 'quests', {
      orderBy: 'createdAt',
      direction: 'desc',
      limit: 30,
    });

    // Return only completed and skipped quests
    const history = quests.filter((q) => q.status === 'completed' || q.status === 'skipped');

    res.json({ history });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDailyQuests, completeQuest, skipQuest, getHistory };
