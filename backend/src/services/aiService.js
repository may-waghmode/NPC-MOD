const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ── Mock / Fallback Quests ─────────────────────────────────────
const MOCK_QUESTS = [
  {
    title: 'Defeat the Couch Dragon',
    description: 'Take a 15-minute walk outside. Leave your phone behind and notice three things you haven\'t seen before.',
    category: 'fitness',
    xp_reward: 50,
    difficulty: 'easy',
    why_it_helps: 'Physical movement resets your mental state and boosts creative thinking.',
    proof_type: 'photo',
    proof_instructions: 'Take a photo of something interesting you noticed on your walk.',
    estimated_minutes: 15,
  },
  {
    title: 'The Ghost Message',
    description: 'Message someone you haven\'t talked to in over a month. Not just "hey" — ask about something specific you remember about them.',
    category: 'social',
    xp_reward: 40,
    difficulty: 'medium',
    why_it_helps: 'Rebuilding dormant connections strengthens your social safety net.',
    proof_type: 'photo',
    proof_instructions: 'Take a screenshot of the message you sent.',
    estimated_minutes: 10,
  },
  {
    title: 'The 20-Minute Scholar',
    description: 'Pick a topic you\'ve been curious about. Watch a video or read an article. Write down 3 key takeaways.',
    category: 'growth',
    xp_reward: 45,
    difficulty: 'easy',
    why_it_helps: 'Micro-learning sessions compound into deep knowledge over time.',
    proof_type: 'photo',
    proof_instructions: 'Take a photo of your 3 written takeaways.',
    estimated_minutes: 20,
  },
  {
    title: 'The Chaos Roll',
    description: 'Do something completely random you\'ve never done before. Cook a new recipe, try a new route, or learn a random skill for 15 minutes.',
    category: 'chaos',
    xp_reward: 55,
    difficulty: 'medium',
    why_it_helps: 'Breaking routine builds adaptability and sparks creativity.',
    proof_type: 'photo',
    proof_instructions: 'Take a photo proving you tried something new!',
    estimated_minutes: 15,
  },
];

const MOCK_MEGA_QUEST = {
  title: '🏆 The Comfort Zone Crusher',
  description: 'Do something today that genuinely makes you uncomfortable but grows you. Could be speaking up in a meeting, trying a new hobby, or having a hard conversation. This is your boss battle — no retreating.',
  category: 'boss',
  xp_reward: 400,
  difficulty: 'hard',
  why_it_helps: 'Boss battles accelerate growth by forcing you past your default patterns.',
  proof_type: 'photo',
  proof_instructions: 'Take a photo as evidence of you crushing your comfort zone!',
  estimated_minutes: 120,
  deadline_hours: 168,
};

/**
 * Build the system prompt for quest generation.
 */
function buildSystemPrompt() {
  return `You are a fun life coach and game designer creating quests for a self-improvement app.
Your job is to make personalized daily challenges that feel like a game.

LANGUAGE RULES:
- Use SIMPLE, everyday words. Write like you're texting a friend.
- Quest titles should be short, catchy, and fun (use emojis sometimes)
- Descriptions should be clear — anyone should understand what to do
- Don't use fancy words or corporate language
- Keep it casual and motivating

QUEST DESIGN RULES:
- Make quests practical and doable in real life
- If user skips a category often, make those quests EASIER (baby steps)
- If user has a streak going, level up the difficulty a bit
- One quest should push them slightly outside their comfort zone
- Include one fun/random quest for variety
- ALL quests MUST have proof_type set to "photo"
- proof_instructions should clearly say what photo to take (be specific, e.g. "Take a pic of your walking route" not just "Take a photo")

PERSONALIZE BY CLASS:
- Warrior: Action-oriented, physical challenges
- Scholar: Learning and thinking challenges
- Social: People and conversation challenges
- Explorer: Try new things and adventures

PERSONALIZE BY GOALS:
- Base quest themes on what the user actually wants to improve
- Work around their avoidance patterns
- Introverts get gentler social quests, extroverts get bolder ones
- Match quest timing to when they have most energy

Return ONLY valid JSON, no markdown, no explanation, no code fences.`;
}

/**
 * Build the user message for quest generation.
 */
function buildUserMessage(userProfile, behaviorLog = []) {
  const now = new Date();
  return JSON.stringify({
    user: {
      name: userProfile.name || 'Adventurer',
      class: userProfile.class || 'Explorer',
      level: userProfile.level || 1,
      goals: userProfile.goals || [],
      avoidanceAnswer: userProfile.avoidanceAnswer || '',
      personalityType: userProfile.personalityType || 'ambivert',
      energyPeak: userProfile.energyPeak || 'morning',
      motivationStyle: userProfile.motivationStyle || 'curiosity',
      streak: userProfile.streak || 0,
      avoidancePatterns: userProfile.avoidancePatterns || [],
      questsCompleted: userProfile.questsCompleted || 0,
      xp: userProfile.xp || 0,
    },
    behavior_summary: summarizeBehavior(behaviorLog),
    context: {
      time_of_day: now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening',
      day_of_week: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()],
      date: now.toISOString().slice(0, 10),
    },
    required_output: {
      daily_quests: '4 quests, each with: title, description, category (social|fitness|growth|chaos), xp_reward (30-70), difficulty (easy|medium|hard), why_it_helps, proof_type (MUST be "photo"), proof_instructions (describe what photo to take), estimated_minutes (5-60)',
      mega_quest: '1 boss battle with: title, description, category (boss), xp_reward (300-500), difficulty (hard), why_it_helps, proof_type (MUST be "photo"), proof_instructions (describe what photo to take), estimated_minutes (60-180), deadline_hours (168)',
    },
  });
}

/**
 * Summarize behavior log into skip/complete counts per category.
 */
function summarizeBehavior(log) {
  const summary = {};
  for (const entry of log) {
    const cat = entry.category || 'unknown';
    if (!summary[cat]) summary[cat] = { completed: 0, skipped: 0 };
    if (entry.eventType === 'quest_completed') summary[cat].completed++;
    if (entry.eventType === 'quest_skipped') summary[cat].skipped++;
  }
  return summary;
}

/**
 * Force all quests to have photo proof (safety net for AI output).
 */
function enforcePhotoProof(quest) {
  return {
    ...quest,
    proof_type: 'photo',
    proof_instructions: quest.proof_instructions || 'Take a photo as proof of completion!',
  };
}

/**
 * Generate daily quests using Gemini API.
 * Falls back to mock quests if API key not set or call fails.
 */
async function generateQuests(userProfile, behaviorLog = []) {
  if (!GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY not set. Using mock quests.');
    return {
      daily_quests: MOCK_QUESTS.map(enforcePhotoProof),
      mega_quest: enforcePhotoProof(MOCK_MEGA_QUEST),
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: buildSystemPrompt() + '\n\nUSER DATA:\n' + buildUserMessage(userProfile, behaviorLog) }] },
      ],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    });

    const text = result.response.text();
    const data = JSON.parse(text);

    if (data && Array.isArray(data.daily_quests) && data.daily_quests.length >= 3) {
      return {
        daily_quests: data.daily_quests.slice(0, 4).map(enforcePhotoProof),
        mega_quest: enforcePhotoProof(data.mega_quest || MOCK_MEGA_QUEST),
      };
    }

    console.warn('⚠️  Gemini returned unexpected format, using mock quests.');
    return {
      daily_quests: MOCK_QUESTS.map(enforcePhotoProof),
      mega_quest: enforcePhotoProof(MOCK_MEGA_QUEST),
    };
  } catch (err) {
    console.warn(`⚠️  Gemini quest generation failed (${err.message}). Using mock quests.`);
    return {
      daily_quests: MOCK_QUESTS.map(enforcePhotoProof),
      mega_quest: enforcePhotoProof(MOCK_MEGA_QUEST),
    };
  }
}

/**
 * Generate a personalized character tagline from onboarding answers.
 */
async function generateTagline(userProfile) {
  if (!GEMINI_API_KEY) {
    const avoidance = userProfile.avoidanceAnswer || 'comfort zone';
    return `The ${userProfile.class || 'Explorer'} Who Avoids ${avoidance} — but not for long.`;
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{
          text: `Generate a short, witty RPG character tagline (max 15 words) for this player:
Class: ${userProfile.class}
Goals: ${(userProfile.goals || []).join(', ')}
Avoidance: ${userProfile.avoidanceAnswer || 'unknown'}
Personality: ${userProfile.personalityType || 'ambivert'}

Return ONLY the tagline text, nothing else. Make it feel like a video game character description. Reference their avoidance humorously.`
        }],
      }],
      generationConfig: { temperature: 1.0, maxOutputTokens: 50 },
    });

    return result.response.text().trim().replace(/^["']|["']$/g, '');
  } catch (err) {
    const avoidance = userProfile.avoidanceAnswer || 'comfort zone';
    return `The ${userProfile.class || 'Explorer'} Who Avoids ${avoidance} — but not for long.`;
  }
}

module.exports = { generateQuests, generateTagline };
