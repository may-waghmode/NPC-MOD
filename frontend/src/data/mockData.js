// Mock data — all icon fields now use string identifiers, rendered by icon-map in components

export const CATEGORY_COLORS = {
  fitness: '#00FF94',
  growth: '#7B6FFF',
  social: '#FF3D7F',
  chaos: '#FF7A1A',
  boss: '#FF2D3B',
};

export const CATEGORY_LABELS = {
  fitness: 'Fitness',
  growth: 'Growth',
  social: 'Social',
  chaos: 'Chaos',
  boss: 'Boss',
};

export const mockPlayer = {
  name: 'Shadow_Knight',
  level: 12,
  xp: 2450,
  maxXp: 3000,
  streak: 14,
  class: 'Warrior',
  totalQuestsCompleted: 87,
  totalXpEarned: 24500,
};

export const mockQuests = [
  {
    id: 'q1',
    title: 'Iron Sanctuary',
    description: 'Conquer 20 minutes of heavy lifting at the local gym.',
    lore: 'The iron calls to thee, warrior. Your muscles are untested steel — raw and unrefined. Enter the sanctuary of iron and emerge reforged. Only through pain does the blade become sharp.',
    category: 'fitness',
    icon: 'dumbbell',
    xpReward: 500,
    timeLeft: '4h 32m',
    difficulty: 2,
    accepted: false,
  },
  {
    id: 'q2',
    title: "Sage's Ritual",
    description: 'Absorb knowledge for 30 minutes from a non-fiction scroll.',
    lore: 'The mind is a weapon. Sharpen it. Thirty minutes of focused study separates the scholar from the peasant. Open the tome. Read. Absorb. Become.',
    category: 'growth',
    icon: 'book',
    xpReward: 350,
    timeLeft: '6h 15m',
    difficulty: 1,
    accepted: false,
  },
  {
    id: 'q3',
    title: 'Wild Card',
    description: 'Talk to a complete stranger and learn one fact about them.',
    lore: 'Chaos is power misunderstood. Step into the unknown. Address a stranger. Extract knowledge. The warrior who understands chaos controls it.',
    category: 'chaos',
    icon: 'dice',
    xpReward: 650,
    timeLeft: '2h 00m',
    difficulty: 3,
    accepted: false,
  },
];

export const mockBossBattle = {
  id: 'boss-weekly',
  name: 'THE PROCRASTINATOR',
  description: 'A towering nemesis born from missed deadlines and broken promises. Defeat it by completing 5 quests before Sunday.',
  xpReward: 2000,
  progress: 3,
  total: 5,
  timeLeft: '2 days 4h',
};

export const mockFriends = [
  {
    id: 'f1',
    name: 'Alex Mercer',
    username: 'AlexM',
    level: 9,
    class: 'Scout',
    status: 'online',
    currentQuest: 'Morning Run Protocol',
    questColor: '#00FF94',
  },
  {
    id: 'f2',
    name: 'Jordan Lee',
    username: 'JordanL',
    level: 15,
    class: 'Paladin',
    status: 'offline',
    currentQuest: 'Code Sprint Challenge',
    questColor: '#7B6FFF',
  },
  {
    id: 'f3',
    name: 'Sam Rivers',
    username: 'SamR',
    level: 7,
    class: 'Rogue',
    status: 'online',
    currentQuest: 'Cold Shower Trial',
    questColor: '#FF7A1A',
  },
];

export const mockIncomingChallenge = {
  id: 'ch1',
  from: 'Alex Mercer',
  fromLevel: 9,
  type: 'DUEL',
  questTitle: 'First Light Protocol',
  questDescription: 'Wake up at 6 AM and complete a 10-minute workout before checking your phone.',
  xpReward: 800,
  timeLimit: '23h 14m',
};

export const mockWeeklyXP = [
  { day: 'MON', xp: 850 },
  { day: 'TUE', xp: 1200 },
  { day: 'WED', xp: 600 },
  { day: 'THU', xp: 1500 },
  { day: 'FRI', xp: 950 },
  { day: 'SAT', xp: 1800 },
  { day: 'SUN', xp: 300 },
];

export const mockSkills = [
  { id: 'fitness', label: 'Fitness', percentage: 80, color: '#00FF94', icon: 'sword' },
  { id: 'growth',  label: 'Growth',  percentage: 40, color: '#7B6FFF', icon: 'book' },
  { id: 'social',  label: 'Social',  percentage: 60, color: '#FF3D7F', icon: 'users' },
  { id: 'chaos',   label: 'Chaos',   percentage: 15, color: '#FF7A1A', icon: 'dice', mostAvoided: true },
];

export const mockAchievements = [
  {
    id: 'a1',
    title: 'Night Owl Vanquisher',
    description: 'Completed 5 quests after 10 PM.',
    icon: 'moon',
    unlockedAt: 'Apr 12',
  },
  {
    id: 'a2',
    title: 'Iron Consistent',
    description: 'Maintained a 14-day quest streak.',
    icon: 'trophy',
    unlockedAt: 'Apr 15',
  },
];
