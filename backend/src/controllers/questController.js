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

const MAX_DAILY_QUESTS = 4;
const QUEST_CACHE_TTL = 6 * 60 * 60; // 6 hours

/**
 * Expire active quests from previous days.
 * Marks them as 'expired' so new ones can be generated today.
 */
async function expirePreviousDayQuests(userId) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const activeQuests = await querySubCollection(userId, 'quests', {
    where: { field: 'status', op: '==', value: 'active' },
  });

  let expiredCount = 0;
  for (const quest of activeQuests) {
    // Skip friend-assigned quests (they don't expire daily)
    if (quest.assignedBy && quest.assignedBy !== 'self' && quest.assignedBy !== 'system') {
      continue;
    }

    const created = quest.createdAt?.toDate ? quest.createdAt.toDate() : new Date(quest.createdAt);
    if (created < todayStart) {
      await updateSubDoc(userId, 'quests', quest.id, { status: 'expired' });
      expiredCount++;
    }
  }

  if (expiredCount > 0) {
    console.log(`Expired ${expiredCount} old quests for user ${userId}`);
  }

  return expiredCount;
}

/**
 * GET /api/quests/daily
 * Returns active quests. Only generates new ones if user has no active daily quests for today.
 */
async function getDailyQuests(req, res, next) {
  try {
    const { userId } = req;
    console.log(`\n🎯 getDailyQuests called for user: ${userId}`);

    // 0. Expire quests from previous days so new ones can be generated
    const expiredCount = await expirePreviousDayQuests(userId);
    console.log(`   Expired ${expiredCount} old quests`);

    // 1. Check for existing active quests first
    const existingQuests = await querySubCollection(userId, 'quests', {
      where: { field: 'status', op: '==', value: 'active' },
    });
    console.log(`   Found ${existingQuests.length} active quests in Firestore`);

    // 1b. Also fetch pending challenge quests from friends
    const pendingQuests = await querySubCollection(userId, 'quests', {
      where: { field: 'status', op: '==', value: 'pending' },
    });
    const challenges = pendingQuests.filter(q => q.assignedBy && q.assignedBy !== 'self' && q.assignedBy !== 'system');

    // Filter to today's daily quests (non-boss, non-friend-assigned)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayDailyQuests = existingQuests.filter(q => {
      if (q.category === 'boss') return false;
      if (q.assignedBy && q.assignedBy !== 'self' && q.assignedBy !== 'system') return false;
      // Check if the quest was created TODAY
      const created = q.createdAt?.toDate ? q.createdAt.toDate() : (q.createdAt ? new Date(q.createdAt) : null);
      if (!created || created < todayStart) return false; // Exclude quests without valid date or from previous days
      return true;
    });
    console.log(`   Today's daily quests: ${todayDailyQuests.length}`);
    if (todayDailyQuests.length > 0) {
      console.log(`   Titles: ${todayDailyQuests.map(q => q.title).join(', ')}`);
    }

    // Friend-assigned active quests (always show)
    const friendQuests = existingQuests.filter(q => q.assignedBy && q.assignedBy !== 'self' && q.assignedBy !== 'system');

    // If user already has today's daily quests, return them + pending challenges
    if (todayDailyQuests.length > 0) {
      console.log(`   ✅ Returning ${todayDailyQuests.length} existing quests (already generated today)`);
      const mega = existingQuests.find(q => q.category === 'boss') || null;
      return res.json({
        daily_quests: [...todayDailyQuests, ...friendQuests],
        mega_quest: mega,
        challenges,
        cached: false,
      });
    }

    // 2. Check if user completed onboarding
    const userProfile = await getUser(userId);
    if (!userProfile || !userProfile.onboardingComplete) {
      console.log(`   ❌ Onboarding not complete! userProfile exists: ${!!userProfile}, onboardingComplete: ${userProfile?.onboardingComplete}`);
      return res.json({ daily_quests: friendQuests, mega_quest: null, challenges, cached: false, message: 'Complete onboarding first!' });
    }
    console.log(`   ✅ Onboarding complete. Name: ${userProfile.name}, Class: ${userProfile.class}, Goals: ${(userProfile.goals || []).join(', ')}`);

    // 3. Check Redis cache (keyed by userId + date so new day = new quests)
    const today = new Date().toISOString().slice(0, 10);
    const cacheKey = `quests:${userId}:${today}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log(`   📦 Returning cached quests from Redis`);
      return res.json({
        daily_quests: [...(cached.daily_quests || []), ...friendQuests],
        mega_quest: cached.mega_quest,
        challenges,
        cached: true,
      });
    }

    // 4. Gather behavior log for AI personalization
    const behaviorLog = await querySubCollection(userId, 'behavior_log', {
      orderBy: 'timestamp',
      direction: 'desc',
      limit: 50,
    });
    console.log(`   📊 Behavior log entries: ${behaviorLog.length}`);

    // 5. Call Gemini AI to generate personalized quests
    console.log(`   🤖 Calling Gemini AI to generate personalized quests...`);
    const { daily_quests, mega_quest } = await generateQuests(userProfile, behaviorLog);
    console.log(`   🤖 AI returned ${daily_quests.length} quests. First title: "${daily_quests[0]?.title || 'N/A'}"`);

    // 6. Save quests to Firestore
    const savedQuests = [];
    for (const quest of daily_quests.slice(0, MAX_DAILY_QUESTS)) {
      const id = await addSubDoc(userId, 'quests', {
        ...quest,
        proof_type: 'photo', // enforce photo proof
        status: 'active',
        assignedBy: 'self',
      });
      savedQuests.push({ id, ...quest, proof_type: 'photo', status: 'active', assignedBy: 'self' });
    }
    console.log(`   💾 Saved ${savedQuests.length} quests to Firestore`);

    // Save mega quest (boss battle)
    const megaId = await addSubDoc(userId, 'quests', {
      ...mega_quest,
      proof_type: 'photo', // enforce photo proof for boss too
      status: 'active',
      assignedBy: 'system',
    });
    const savedMega = { id: megaId, ...mega_quest, proof_type: 'photo', status: 'active', assignedBy: 'system' };

    // 7. Cache result (keyed by date)
    const cachePayload = { daily_quests: savedQuests, mega_quest: savedMega };
    await redis.set(cacheKey, cachePayload, QUEST_CACHE_TTL);

    res.json({
      daily_quests: [...savedQuests, ...friendQuests],
      mega_quest: savedMega,
      challenges,
      cached: false,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/quests/complete
 * Requires photo proof for all quests.
 * Handles XP transfer for friend-assigned challenge quests.
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

    // Enforce photo proof for all quests
    const effectiveProofType = 'photo';
    const verification = await verifyProof(
      quest.description || quest.title,
      quest.proof_instructions || 'Take a photo as proof of completion.',
      effectiveProofType,
      proofData || {}
    );

    if (!verification.verified) {
      return res.json({ verified: false, message: verification.message });
    }

    // Update quest
    const updateData = { status: 'completed', completedAt: Timestamp.now() };
    if (proofData?.imageUrl) updateData.proofUrl = proofData.imageUrl;
    if (proofData?.imageBase64) updateData.hasPhotoProof = true;
    await updateSubDoc(userId, 'quests', questId, updateData);

    // Determine XP reward
    const baseXpReward = quest.xp_reward || quest.xpReward || 50;

    // Check if this is a friend-assigned challenge quest
    const isFriendChallenge = quest.assignedBy && quest.assignedBy !== 'self' && quest.assignedBy !== 'system';

    // Add XP to completer
    const xpResult = await addXP(userId, baseXpReward);

    // If friend challenge: deduct XP from the challenger (sender)
    if (isFriendChallenge && quest.challengeXpReward) {
      try {
        const challenger = await getUser(quest.assignedBy);
        if (challenger) {
          const deductAmount = quest.challengeXpReward;
          const newChallengerXP = Math.max(0, (challenger.xp || 0) - deductAmount);
          await updateUser(quest.assignedBy, { xp: newChallengerXP });

          // Notify the challenger that their friend completed the quest
          await addSubDoc(quest.assignedBy, 'notifications', {
            type: 'challenge_completed',
            fromUserId: userId,
            fromName: (await getUser(userId))?.name || 'A friend',
            questTitle: quest.title,
            xpDeducted: deductAmount,
            message: `completed your challenge "${quest.title}"! You lost ${deductAmount} XP.`,
            read: false,
            createdAt: Timestamp.now(),
          });

          // Invalidate challenger's cache
          await redis.del(`stats:${quest.assignedBy}`);
        }
      } catch (challengeErr) {
        console.warn('Challenge XP transfer failed:', challengeErr.message);
      }
    }

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

    // Notify friends about this completion
    try {
      const { getFriends } = require('../firebase/firestoreHelpers');
      const user = await getUser(userId);
      const friends = await getFriends(userId);
      for (const friend of friends) {
        await addSubDoc(friend.id, 'notifications', {
          type: 'friend_quest_complete',
          fromUserId: userId,
          fromName: user.name || 'A friend',
          fromClass: user.class || 'Explorer',
          questTitle: quest.title,
          questCategory: quest.category || 'growth',
          xpEarned: xpResult.earnedXP,
          read: false,
          createdAt: Timestamp.now(),
        });
      }
    } catch (notifErr) {
      console.warn('Friend notification failed:', notifErr.message);
    }

    // Invalidate caches
    const todayStr = new Date().toISOString().slice(0, 10);
    await redis.del(`quests:${userId}:${todayStr}`);
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

    // If this was a friend challenge, refund XP to the challenger
    const isFriendChallenge = quest.assignedBy && quest.assignedBy !== 'self' && quest.assignedBy !== 'system';
    if (isFriendChallenge && quest.challengeXpReward) {
      // No XP was deducted at assignment time, so no refund needed
      // But notify the challenger
      try {
        const user = await getUser(userId);
        await addSubDoc(quest.assignedBy, 'notifications', {
          type: 'challenge_declined',
          fromUserId: userId,
          fromName: user?.name || 'A friend',
          questTitle: quest.title,
          message: `declined your challenge "${quest.title}".`,
          read: false,
          createdAt: Timestamp.now(),
        });
      } catch (notifErr) {
        console.warn('Decline notification failed:', notifErr.message);
      }
    }

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
    const todayStr = new Date().toISOString().slice(0, 10);
    await redis.del(`quests:${userId}:${todayStr}`);
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
