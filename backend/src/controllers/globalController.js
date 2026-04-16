const { db, admin } = require('../firebase/config');
const { Timestamp } = require('../firebase/firestoreHelpers');

/**
 * GET /api/global/mega-quest
 *
 * Returns the current global mega quest.
 * Creates a new one if none exists or old one expired.
 */
async function getMegaQuest(req, res, next) {
  try {
    const ref = db.collection('global').doc('mega_quest');
    let doc = await ref.get();

    const now = new Date();

    // Check if mega quest exists and is still valid
    if (doc.exists) {
      const data = doc.data();
      const endTime = data.endTime?.toDate ? data.endTime.toDate() : new Date(data.endTime);

      if (endTime > now) {
        return res.json({
          ...data,
          endTime: endTime.toISOString(),
          startTime: data.startTime?.toDate ? data.startTime.toDate().toISOString() : data.startTime,
          timeRemaining: endTime.getTime() - now.getTime(),
        });
      }
    }

    // Create new mega quest (expires next Monday 00:00, or 7 days from now)
    const nextMonday = getNextMonday();
    const megaQuests = [
      {
        title: '🏆 The Comfort Zone Crusher',
        theme: 'face_your_fear',
        description_template: 'Do something this week that genuinely makes you uncomfortable but grows you.',
        xpReward: 400,
      },
      {
        title: '⚔️ The Social Siege',
        theme: 'social_challenge',
        description_template: 'Talk to 5 new people this week. Not texts — real conversations.',
        xpReward: 450,
      },
      {
        title: '🧠 The Knowledge Sprint',
        theme: 'learning_challenge',
        description_template: 'Learn something completely new this week and teach it to someone else.',
        xpReward: 400,
      },
      {
        title: '💪 The Iron Week',
        theme: 'fitness_challenge',
        description_template: 'Exercise or be active every single day this week. No excuses.',
        xpReward: 500,
      },
      {
        title: '🎲 The Chaos Protocol',
        theme: 'chaos_challenge',
        description_template: 'Say YES to something unexpected every day this week.',
        xpReward: 350,
      },
    ];

    const selected = megaQuests[Math.floor(Math.random() * megaQuests.length)];

    const newMegaQuest = {
      ...selected,
      startTime: Timestamp.now(),
      endTime: Timestamp.fromDate(nextMonday),
      participantCount: 0,
      createdAt: Timestamp.now(),
    };

    await ref.set(newMegaQuest);

    res.json({
      ...newMegaQuest,
      endTime: nextMonday.toISOString(),
      startTime: now.toISOString(),
      timeRemaining: nextMonday.getTime() - now.getTime(),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/global/mega-quest/accept
 */
async function acceptMegaQuest(req, res, next) {
  try {
    const { userId } = req;

    // Increment participant count atomically
    const ref = db.collection('global').doc('mega_quest');
    await ref.update({
      participantCount: admin.firestore.FieldValue.increment(1),
    });

    // Store user's acceptance
    const userMegaRef = db.collection('users').doc(userId).collection('mega_quest').doc('current');
    await userMegaRef.set({
      accepted: true,
      completed: false,
      acceptedAt: Timestamp.now(),
    }, { merge: true });

    const doc = await ref.get();
    res.json({
      success: true,
      participantCount: doc.data().participantCount,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/global/mega-quest/complete
 */
async function completeMegaQuest(req, res, next) {
  try {
    const { userId } = req;

    const userMegaRef = db.collection('users').doc(userId).collection('mega_quest').doc('current');
    await userMegaRef.update({
      completed: true,
      completedAt: Timestamp.now(),
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

function getNextMonday() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 1 : 8 - day;
  const next = new Date(now);
  next.setDate(now.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

module.exports = { getMegaQuest, acceptMegaQuest, completeMegaQuest };
