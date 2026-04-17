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
        // Check if requesting user already accepted (if userId present)
        let accepted = false;
        if (req.userId) {
          const userMegaRef = db.collection('users').doc(req.userId).collection('mega_quest').doc('current');
          const userMegaDoc = await userMegaRef.get();
          if (userMegaDoc.exists && userMegaDoc.data().accepted) {
            accepted = true;
          }
        }

        return res.json({
          ...data,
          id: 'mega_quest',
          endTime: endTime.toISOString(),
          startTime: data.startTime?.toDate ? data.startTime.toDate().toISOString() : data.startTime,
          timeRemaining: endTime.getTime() - now.getTime(),
          proof_type: 'photo',
          proof_instructions: 'Take a photo as evidence of conquering the boss battle!',
          accepted,
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
      proof_type: 'photo',
      proof_instructions: 'Take a photo as evidence of conquering the boss battle!',
      createdAt: Timestamp.now(),
    };

    await ref.set(newMegaQuest);

    res.json({
      ...newMegaQuest,
      id: 'mega_quest',
      endTime: nextMonday.toISOString(),
      startTime: now.toISOString(),
      timeRemaining: nextMonday.getTime() - now.getTime(),
      accepted: false,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/global/mega-quest/accept
 * Only allows one accept per user per boss battle.
 */
async function acceptMegaQuest(req, res, next) {
  try {
    const { userId } = req;

    // Check if user already accepted this boss battle
    const userMegaRef = db.collection('users').doc(userId).collection('mega_quest').doc('current');
    const existingDoc = await userMegaRef.get();

    if (existingDoc.exists && existingDoc.data().accepted) {
      // Already accepted — return current data without incrementing
      const ref = db.collection('global').doc('mega_quest');
      const doc = await ref.get();
      return res.json({
        success: true,
        alreadyAccepted: true,
        participantCount: doc.exists ? doc.data().participantCount : 0,
        message: 'You already accepted this boss battle!',
      });
    }

    // Increment participant count atomically
    const ref = db.collection('global').doc('mega_quest');
    await ref.update({
      participantCount: admin.firestore.FieldValue.increment(1),
    });

    // Store user's acceptance with the mega quest's start time for tracking
    const megaDoc = await ref.get();
    const megaStartTime = megaDoc.data()?.startTime || Timestamp.now();

    await userMegaRef.set({
      accepted: true,
      completed: false,
      acceptedAt: Timestamp.now(),
      megaQuestStartTime: megaStartTime, // to know which boss battle this belongs to
    }, { merge: true });

    const doc = await ref.get();
    res.json({
      success: true,
      alreadyAccepted: false,
      participantCount: doc.data().participantCount,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/global/mega-quest/complete
 * Requires photo proof.
 */
async function completeMegaQuest(req, res, next) {
  try {
    const { userId } = req;

    const userMegaRef = db.collection('users').doc(userId).collection('mega_quest').doc('current');
    const existingDoc = await userMegaRef.get();

    if (!existingDoc.exists || !existingDoc.data().accepted) {
      return res.status(400).json({ error: true, message: 'You must accept the boss battle first!' });
    }

    if (existingDoc.data().completed) {
      return res.json({ success: true, message: 'You already completed this boss battle!' });
    }

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
