/**
 * Mock data for offline/demo mode.
 */

export const mockPlayer = {
  name: 'Adventurer',
  level: 3,
  xp: 1450,
  xpToNextLevel: 1050,
  title: 'The Committed One',
  class: 'Warrior',
  streak: 7,
  questsCompleted: 23,
  completionRate: 78,
  strongestCategory: 'fitness',
  mostAvoidedCategory: 'social',
  categoryStats: {
    fitness: { completed: 12, skipped: 2 },
    growth: { completed: 6, skipped: 3 },
    social: { completed: 3, skipped: 7 },
    chaos: { completed: 2, skipped: 1 },
  },
  weeklyXP: [
    { day: 'Mon', xp: 120 },
    { day: 'Tue', xp: 90 },
    { day: 'Wed', xp: 150 },
    { day: 'Thu', xp: 0 },
    { day: 'Fri', xp: 200 },
    { day: 'Sat', xp: 75 },
    { day: 'Sun', xp: 110 },
  ],
  tagline: 'The Warrior Who Avoids Small Talk — but not for long.',
  villainModeActive: false,
  avoidancePatterns: [],
  goals: ['Get fit', 'Be more social', 'Finish personal projects'],
  friendCode: 'NPC42X',
};

export const mockQuests = [
  {
    id: 'mock-1',
    title: 'Defeat the Couch Dragon',
    description: 'Take a 15-minute walk outside. Leave your phone behind and notice three things you haven\'t seen before.',
    category: 'fitness',
    xp_reward: 50,
    difficulty: 'easy',
    why_it_helps: 'Physical movement resets your mental state and boosts creative thinking.',
    proof_type: 'honor_system',
    proof_instructions: 'Mark complete when you return.',
    estimated_minutes: 15,
    status: 'active',
  },
  {
    id: 'mock-2',
    title: 'The Ghost Message',
    description: 'Message someone you haven\'t talked to in over a month. Not just "hey" — ask about something specific.',
    category: 'social',
    xp_reward: 40,
    difficulty: 'medium',
    why_it_helps: 'Rebuilding dormant connections strengthens your social safety net.',
    proof_type: 'text',
    proof_instructions: 'Paste the message you sent.',
    estimated_minutes: 10,
    status: 'active',
  },
  {
    id: 'mock-3',
    title: 'The 20-Minute Scholar',
    description: 'Pick a topic you\'ve been curious about. Watch a video, read an article. Write down 3 key takeaways.',
    category: 'growth',
    xp_reward: 45,
    difficulty: 'easy',
    why_it_helps: 'Micro-learning sessions compound into deep knowledge over time.',
    proof_type: 'text',
    proof_instructions: 'Write your 3 takeaways.',
    estimated_minutes: 20,
    status: 'active',
  },
];

export const mockMegaQuest = {
  id: 'mock-mega',
  title: '🏆 The Comfort Zone Crusher',
  description: 'Do something this week that genuinely makes you uncomfortable but grows you.',
  category: 'boss',
  xp_reward: 400,
  difficulty: 'hard',
  why_it_helps: 'Boss battles accelerate growth by forcing you past your default patterns.',
  proof_type: 'text',
  proof_instructions: 'Describe what you did and how it felt.',
  estimated_minutes: 120,
  status: 'active',
};

export const mockFriends = [
  {
    friendId: 'friend-1',
    name: 'Rahul',
    level: 7,
    class: 'Warrior',
    streak: 12,
    xp: 3200,
    title: 'The Relentless',
  },
  {
    friendId: 'friend-2',
    name: 'Priya',
    level: 12,
    class: 'Scholar',
    streak: 24,
    xp: 8900,
    title: 'The Unstoppable',
  },
  {
    friendId: 'friend-3',
    name: 'Arjun',
    level: 4,
    class: 'Explorer',
    streak: 3,
    xp: 2100,
    title: 'The Grinder',
  },
];

export const CLASS_DATA = {
  Warrior: { emoji: '⚔️', color: '#FF4757', desc: 'Fitness + discipline focused' },
  Scholar: { emoji: '📚', color: '#6C63FF', desc: 'Knowledge + deep work focused' },
  Social: { emoji: '🗣️', color: '#FF6B9D', desc: 'Relationships + communication focused' },
  Explorer: { emoji: '🧭', color: '#FF9F43', desc: 'New experiences + chaos quests focused' },
};

export const GOALS = [
  'Get fit and active',
  'Build better focus and deep work habits',
  'Be more social and meet new people',
  'Finish personal projects',
  'Reduce screen time / phone addiction',
  'Sleep better and build routines',
  'Learn new skills',
  'Be more present and mindful',
];

export const CATEGORY_COLORS = {
  fitness: '#00E5A0',
  growth: '#6C63FF',
  social: '#FF6B9D',
  chaos: '#FF9F43',
  boss: '#FF4757',
};

export const CATEGORY_ICONS = {
  fitness: '💪',
  growth: '📚',
  social: '💬',
  chaos: '🎲',
  boss: '💀',
};
