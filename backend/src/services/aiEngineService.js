const axios = require('axios');

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:5001';

// ── Mock / Fallback Quests ─────────────────────────────────────
// Used when the AI engine is unreachable so the demo still works.
const MOCK_QUESTS = [
  {
    title: 'Take a 15-minute walk outside',
    description: 'Leave your phone behind and walk around the block. Notice three things you haven\'t seen before.',
    category: 'fitness',
    xpReward: 50,
    whyItHelps: 'Physical movement resets your mental state and boosts creative thinking.',
  },
  {
    title: 'Message someone you haven\'t talked to in a month',
    description: 'Send a genuine message — not just "hey." Ask about something specific you remember about them.',
    category: 'social',
    xpReward: 40,
    whyItHelps: 'Rebuilding dormant connections strengthens your social safety net.',
  },
  {
    title: 'Learn one new concept for 20 minutes',
    description: 'Pick a topic you\'ve been curious about. Watch a video or read an article. Write down 3 key takeaways.',
    category: 'growth',
    xpReward: 45,
    whyItHelps: 'Micro-learning sessions compound into deep knowledge over time.',
  },
];

const MOCK_BOSS_BATTLE = {
  title: '🏆 Boss Battle: The Comfort Zone Crusher',
  description: 'Do something today that genuinely makes you uncomfortable but grows you. Could be speaking up in a meeting, trying a new hobby, or having a hard conversation.',
  category: 'boss',
  xpReward: 150,
  whyItHelps: 'Boss battles accelerate growth by forcing you past your default patterns.',
};

/**
 * Generate daily quests by calling the AI engine.
 * Falls back to mock quests if the AI engine is unreachable.
 *
 * @param {object} userProfile  - User doc from Firestore
 * @param {object[]} behaviorLog - Recent behavior log entries
 * @param {object} externalData - Calendar/Fit/Spotify data
 * @returns {{ quests: object[], bossBattle: object }}
 */
async function generateQuests(userProfile, behaviorLog = [], externalData = {}) {
  try {
    const response = await axios.post(
      `${AI_ENGINE_URL}/generate-quests`,
      {
        userProfile,
        behaviorLog,
        externalData,
      },
      { timeout: 10000 } // 10s timeout
    );

    const data = response.data;

    // Expect the AI engine to return { quests: [...], bossBattle: {...} }
    if (data && Array.isArray(data.quests) && data.quests.length > 0) {
      return {
        quests: data.quests.slice(0, 3),
        bossBattle: data.bossBattle || MOCK_BOSS_BATTLE,
      };
    }

    console.warn('⚠️  AI engine returned unexpected format, using mock quests.');
    return { quests: MOCK_QUESTS, bossBattle: MOCK_BOSS_BATTLE };
  } catch (err) {
    console.warn(`⚠️  AI engine unreachable (${err.message}). Using mock quests for demo.`);
    return { quests: MOCK_QUESTS, bossBattle: MOCK_BOSS_BATTLE };
  }
}

/**
 * Generate an initial behavior profile from onboarding answers.
 * Falls back to a generic profile if the AI engine is unreachable.
 *
 * @param {object} onboardingAnswers
 * @returns {object} Behavior profile
 */
async function generateBehaviorProfile(onboardingAnswers) {
  try {
    const response = await axios.post(
      `${AI_ENGINE_URL}/generate-profile`,
      { onboardingAnswers },
      { timeout: 10000 }
    );
    return response.data;
  } catch (err) {
    console.warn(`⚠️  AI engine unreachable for profile generation. Using defaults.`);
    return {
      avoidancePatterns: [],
      suggestedFocus: ['growth', 'fitness'],
      notes: 'Default profile — AI engine was unavailable during onboarding.',
    };
  }
}

module.exports = { generateQuests, generateBehaviorProfile };
