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
const { generateQuests } = require('../services/aiService');
const { verifyProof } = require('../services/proofService');
const redis = require('../services/redisService');
const { ValidationError, NotFoundError } = require('../middleware/errorHandler');

const MAX_DAILY_QUESTS = 3;
const QUEST_CACHE_TTL = 6 * 60 * 60; // 6 hours

/**
 * GET /api/quests/daily
 * Returns active quests. Only generates new ones if user has < MAX_DAILY_QUESTS active.
 */
async function getDailyQuests(req, res, next) {
  try {
    const { userId } = req;

    // 1. Check for existing active quests first
    const existingQuests = await querySubCollection(userId, 'quests', {
      where: { field: 'status', op: '==', value: 'active' },
    });

    // If user already has active quests, return them
    if (existingQuests.length > 0) {
      const daily = existingQuests.filter(q => q.category !== 'boss');
      const mega = existingQuests.find(q => q.category === 'boss') || null;
      return res.json({ daily_quests: daily, mega_quest: mega, cached: false });
    }

    // 2. Check if user completed onboarding
    const userProfile = await getUser(userId);
    if (!userProfile || !userProfile.onboardingComplete) {
      return res.json({ daily_quests: [], mega_quest: null, cached: false, message: 'Complete onboarding first!' });
    }

    // 3. Check Redis cache
    const cacheKey = `quests:${userId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({ daily_quests: cached.daily_quests, mega_quest: cached.mega_quest, cached: true });
    }

    // 4. Check daily limit — count quests created today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const allTodayQuests = await querySubCollection(userId, 'quests', {
      orderBy: 'createdAt',
      direction: 'desc',
      limit: 20,
    });
    const todayQuests = allTodayQuests.filter(q => {
      if (!q.createdAt) return false;
      const created = q.createdAt.toDate ? q.createdAt.toDate() : new Date(q.createdAt);
      return created >= todayStart;
    });

    if (todayQuests.length >= MAX_DAILY_QUESTS + 1) { // +1 for mega quest
      return res.json({
        daily_quests: [],
        mega_quest: null,
        cached: false,
        message: 'Daily quest limit reached. Come back tomorrow!',
      });
    }

    // 5. Gather behavior log for AI personalization
    const behaviorLog = await querySubCollection(userId, 'behavior_log', {
      orderBy: 'timestamp',
      direction: 'desc',
      limit: 50,
    });

    // 6. Call Gemini AI to generate quests
    const { daily_quests, mega_quest } = await generateQuests(userProfile, behaviorLog);

    // 7. Save quests to Firestore
    const savedQuests = [];
    for (const quest of daily_quests.slice(0, MAX_DAILY_QUESTS)) {
      const id = await addSubDoc(userId, 'quests', {
        ...quest,
        status: 'active',
        assignedBy: 'self',
      });
      savedQuests.push({ id, ...quest, status: 'active', assignedBy: 'self' });
    }

    // Save mega quest
    const megaId = await addSubDoc(userId, 'quests', {
      ...mega_quest,
      status: 'active',
      assignedBy: 'system',
    });
    const savedMega = { id: megaId, ...mega_quest, status: 'active', assignedBy: 'system' };

    // 8. Cache result
    const cachePayload = { daily_quests: savedQuests, mega_quest: savedMega };
    await redis.set(cacheKey, cachePayload, QUEST_CACHE_TTL);

    res.json({ daily_quests: savedQuests, mega_quest: savedMega, cached: false });
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
    const { questId, proofType, proofData } = req.body;

    if (!questId) throw new ValidationError('questId is required.');

    const quest = await getSubDoc(userId, 'quests', questId);
    if (!quest) throw new NotFoundError('Quest not found.');
    if (quest.status === 'completed') {
      return res.json({ message: 'Quest already completed', verified: true, earnedXP: 0, leveledUp: false });
    }

    // Verify proof
    const effectiveProofType = proofType || quest.proof_type || 'honor_system';
    const verification = await verifyProof(
      quest.description || quest.title,
      quest.proof_instructions || 'Complete the quest.',
      effectiveProofType,
      proofData || {}
    );

    if (!verification.verified) {
      return res.json({ verified: false, message: verification.message });
    }

    // Update quest
    const updateData = { status: 'completed', completedAt: Timestamp.now() };
    if (proofData?.text) updateData.proofText = proofData.text;
    if (proofData?.imageUrl) updateData.proofUrl = proofData.imageUrl;
    await updateSubDoc(userId, 'quests', questId, updateData);

    // Add XP
    const xpResult = await addXP(userId, quest.xp_reward || quest.xpReward || 50);

    // Update streak
    const streakResult = await updateStreak(userId);

    // Comeback bonus
    let comebackBonus = 0;
    if (streakResult && streakResult.isComeback) {
      comebackBonus = 50;
      await addXP(userId, 50);
    }

    // Log behavior
    await addSubDoc(userId, 'behavior_log', {
      eventType: 'quest_completed',
      category: quest.category || 'unknown',
      questId,
      xpEarned: xpResult.earnedXP,
      timestamp: Timestamp.now(),
    });

    // Invalidate caches
    await redis.del(`quests:${userId}`);
    await redis.del(`stats:${userId}`);

    res.json({
      verified: true,
      message: verification.message,
      earnedXP: xpResult.earnedXP,
      newXP: xpResult.newXP,
      newLevel: xpResult.newLevel,
      xpToNextLevel: xpResult.xpToNextLevel,
      leveledUp: xpResult.leveledUp,
      title: xpResult.title,
      streakMultiplier: xpResult.streakMultiplier,
      streak: streakResult?.streak || 0,
      comebackBonus,
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

    await updateSubDoc(userId, 'quests', questId, { status: 'skipped' });

    // Log behavior
    await addSubDoc(userId, 'behavior_log', {
      eventType: 'quest_skipped',
      category: quest.category || 'unknown',
      questId,
      timestamp: Timestamp.now(),
    });

    // Update skip patterns
    const user = await getUser(userId);
    const skipCounts = user.skipCounts || {};
    const cat = quest.category || 'unknown';
    skipCounts[cat] = (skipCounts[cat] || 0) + 1;

    const avoidancePatterns = Object.entries(skipCounts)
      .filter(([, count]) => count >= 3)
      .map(([category]) => category);

    const villainModeActive = avoidancePatterns.length > 0;

    await updateUser(userId, { skipCounts, avoidancePatterns, villainModeActive });

    // Invalidate caches
    await redis.del(`quests:${userId}`);
    await redis.del(`stats:${userId}`);

    res.json({ success: true, villainModeActive });
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
    const history = quests.filter(q => q.status === 'completed' || q.status === 'skipped');
    res.json({ history });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDailyQuests, completeQuest, skipQuest, getHistory };
