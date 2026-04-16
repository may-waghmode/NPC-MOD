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
    proof_type: 'honor_system',
    proof_instructions: 'Mark complete when you\'re back from your walk.',
    estimated_minutes: 15,
  },
  {
    title: 'The Ghost Message',
    description: 'Message someone you haven\'t talked to in over a month. Not just "hey" — ask about something specific you remember about them.',
    category: 'social',
    xp_reward: 40,
    difficulty: 'medium',
    why_it_helps: 'Rebuilding dormant connections strengthens your social safety net.',
    proof_type: 'text',
    proof_instructions: 'Paste the message you sent (we won\'t judge the cringe).',
    estimated_minutes: 10,
  },
  {
    title: 'The 20-Minute Scholar',
    description: 'Pick a topic you\'ve been curious about. Watch a video or read an article. Write down 3 key takeaways.',
    category: 'growth',
    xp_reward: 45,
    difficulty: 'easy',
    why_it_helps: 'Micro-learning sessions compound into deep knowledge over time.',
    proof_type: 'text',
    proof_instructions: 'Write your 3 takeaways here.',
    estimated_minutes: 20,
  },
];

const MOCK_MEGA_QUEST = {
  title: '🏆 The Comfort Zone Crusher',
  description: 'Do something today that genuinely makes you uncomfortable but grows you. Could be speaking up in a meeting, trying a new hobby, or having a hard conversation. This is your boss battle — no retreating.',
  category: 'boss',
  xp_reward: 400,
  difficulty: 'hard',
  why_it_helps: 'Boss battles accelerate growth by forcing you past your default patterns.',
  proof_type: 'text',
  proof_instructions: 'Describe what you did and how it felt. Be honest.',
  estimated_minutes: 120,
  deadline_hours: 168,
};

/**
 * Build the system prompt for quest generation.
 */
function buildSystemPrompt() {
  return `You are an expert behavioral psychologist and RPG game designer.
Your job is to generate hyper-personalized life quests for a real person.

RULES:
- Target ROOT CAUSES of avoided behaviors, not surface symptoms
- If user skips social quests repeatedly, start SMALLER (eye contact → smile → say hi → short conversation)
- Match difficulty to behavior: many skips = easier quests, strong streak = harder quests
- One quest must always be slightly uncomfortable (growth edge)
- Chaos quest is always surprising but achievable
- Language must feel personal, slightly witty, never generic corporate-speak
- Never say "exercise more" — say "Defeat the Couch Dragon"
- proof_type must be one of: "photo", "text", "honor_system"

PERSONALIZE BY CLASS:
- Warrior: Frame as battles and conquest
- Scholar: Frame as experiments and data
- Social: Frame as connections and challenges
- Explorer: Frame as adventures and discoveries

Return ONLY valid JSON, no markdown, no explanation, no code fences.`;
}

/**
 * Build the user message for quest generation.
 */
function buildUserMessage(userProfile, behaviorLog = []) {
  const now = new Date();
  return JSON.stringify({
    user: {
      class: userProfile.class || 'Explorer',
      level: userProfile.level || 1,
      goals: userProfile.goals || [],
      avoidanceAnswer: userProfile.avoidanceAnswer || '',
      personalityType: userProfile.personalityType || 'ambivert',
      energyPeak: userProfile.energyPeak || 'morning',
      motivationStyle: userProfile.motivationStyle || 'curiosity',
      streak: userProfile.streak || 0,
      avoidancePatterns: userProfile.avoidancePatterns || [],
    },
    behavior_summary: summarizeBehavior(behaviorLog),
    context: {
      time_of_day: now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening',
      day_of_week: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()],
    },
    required_output: {
      daily_quests: '3 quests, each with: title, description, category (social|fitness|growth|chaos), xp_reward (30-70), difficulty (easy|medium|hard), why_it_helps, proof_type (photo|text|honor_system), proof_instructions, estimated_minutes (5-60)',
      mega_quest: '1 boss battle with: title, description, category (boss), xp_reward (300-500), difficulty (hard), why_it_helps, proof_type, proof_instructions, estimated_minutes (60-180), deadline_hours (168)',
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
 * Generate daily quests using Gemini API.
 * Falls back to mock quests if API key not set or call fails.
 */
async function generateQuests(userProfile, behaviorLog = []) {
  if (!GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY not set. Using mock quests.');
    return { daily_quests: MOCK_QUESTS, mega_quest: MOCK_MEGA_QUEST };
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
        daily_quests: data.daily_quests.slice(0, 3),
        mega_quest: data.mega_quest || MOCK_MEGA_QUEST,
      };
    }

    console.warn('⚠️  Gemini returned unexpected format, using mock quests.');
    return { daily_quests: MOCK_QUESTS, mega_quest: MOCK_MEGA_QUEST };
  } catch (err) {
    console.warn(`⚠️  Gemini quest generation failed (${err.message}). Using mock quests.`);
    return { daily_quests: MOCK_QUESTS, mega_quest: MOCK_MEGA_QUEST };
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
