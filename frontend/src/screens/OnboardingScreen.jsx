import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/client';
import './OnboardingScreen.css';

const CLASS_DATA = {
  Warrior: { emoji: '⚔️', color: '#FF4757', desc: 'Fitness + discipline focused' },
  Scholar: { emoji: '📚', color: '#6C63FF', desc: 'Knowledge + deep work focused' },
  Social: { emoji: '🗣️', color: '#FF6B9D', desc: 'Relationships + communication' },
  Explorer: { emoji: '🧭', color: '#FF9F43', desc: 'New experiences + chaos quests' },
};

const GOALS = [
  'Get fit and active',
  'Build better focus and deep work habits',
  'Be more social and meet new people',
  'Finish personal projects',
  'Reduce screen time / phone addiction',
  'Sleep better and build routines',
  'Learn new skills',
  'Be more present and mindful',
];

const slideVariants = {
  enter: { x: 300, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -300, opacity: 0 },
};

export default function OnboardingScreen() {
  const { completeOnboarding, user } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [tagline, setTagline] = useState('');

  // Step 0: Name
  const [playerName, setPlayerName] = useState(user?.displayName || '');
  // Step 1: Class
  const [selectedClass, setSelectedClass] = useState('');
  // Step 2: Goals
  const [selectedGoals, setSelectedGoals] = useState([]);
  // Step 3: Avoidance
  const [avoidanceAnswer, setAvoidanceAnswer] = useState('');
  // Step 4: Personality
  const [personalityType, setPersonalityType] = useState('');
  const [energyPeak, setEnergyPeak] = useState('');
  // Step 5: Motivation
  const [motivationStyle, setMotivationStyle] = useState('');
  // Step 6: Character reveal

  const TOTAL_STEPS = 7; // 0-6

  const toggleGoal = (goal) => {
    setSelectedGoals(prev => {
      if (prev.includes(goal)) return prev.filter(g => g !== goal);
      if (prev.length >= 3) return prev;
      return [...prev, goal];
    });
  };

  const canProceed = () => {
    switch (step) {
      case 0: return playerName.trim().length >= 2;
      case 1: return !!selectedClass;
      case 2: return selectedGoals.length > 0;
      case 3: return avoidanceAnswer.trim().length > 2;
      case 4: return !!personalityType && !!energyPeak;
      case 5: return !!motivationStyle;
      default: return true;
    }
  };

  const handleNext = async () => {
    if (step < 5) {
      setStep(step + 1);
    } else if (step === 5) {
      // Submit onboarding
      setLoading(true);
      const payload = {
        name: playerName.trim(),
        class: selectedClass,
        goals: selectedGoals,
        avoidanceAnswer,
        personalityType,
        energyPeak,
        motivationStyle,
      };
      try {
        const res = await api.post('/player/onboarding', payload);
        setTagline(res.data.tagline || `The ${selectedClass} Who Avoids ${avoidanceAnswer} — but not for long.`);
      } catch (err) {
        console.warn('Onboarding API failed:', err);
        setTagline(`The ${selectedClass} Who Avoids ${avoidanceAnswer} — but not for long.`);
      }
      setLoading(false);
      setStep(6);
    } else {
      // Step 6 → finish
      completeOnboarding();
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="onboard-step">
            <h2 className="onboard-heading">What's your name?</h2>
            <p className="onboard-desc">This is how you'll be known in the game</p>
            <input
              type="text"
              className="input name-input"
              placeholder="Enter your name..."
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              maxLength={24}
              autoFocus
            />
            <p className="onboard-hint">You can always change this later.</p>
          </div>
        );

      case 1:
        return (
          <div className="onboard-step">
            <h2 className="onboard-heading">Choose Your Class</h2>
            <p className="onboard-desc">This determines your quest style</p>
            <div className="class-grid">
              {Object.entries(CLASS_DATA).map(([cls, info]) => (
                <motion.button
                  key={cls}
                  className={`class-card ${selectedClass === cls ? 'class-card--selected' : ''}`}
                  onClick={() => setSelectedClass(cls)}
                  whileTap={{ scale: 0.96 }}
                  style={{
                    '--class-color': info.color,
                    borderColor: selectedClass === cls ? info.color : 'rgba(255,255,255,0.06)',
                    boxShadow: selectedClass === cls ? `0 0 24px ${info.color}33` : 'none',
                  }}
                >
                  <span className="class-emoji">{info.emoji}</span>
                  <span className="class-name">{cls}</span>
                  <span className="class-desc">{info.desc}</span>
                </motion.button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="onboard-step">
            <h2 className="onboard-heading">What do you want to level up?</h2>
            <p className="onboard-desc">Tap to select up to 3 goals ({selectedGoals.length}/3 selected)</p>
            <div className="goals-grid">
              {GOALS.map(goal => {
                const sel = selectedGoals.includes(goal);
                return (
                  <motion.button
                    key={goal}
                    className={`goal-chip ${sel ? 'goal-chip--selected' : ''}`}
                    onClick={() => toggleGoal(goal)}
                    whileTap={{ scale: 0.96 }}
                  >
                    {sel && '✓ '}{goal}
                  </motion.button>
                );
              })}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="onboard-step">
            <h2 className="onboard-heading">The Avoidance Question</h2>
            <p className="onboard-desc">What's the ONE thing you keep avoiding?</p>
            <p className="onboard-hint">Be honest. The AI won't judge you. It'll just make you do it. 😈</p>
            <textarea
              className="input"
              placeholder="e.g., going to the gym, talking to strangers, finishing my project..."
              value={avoidanceAnswer}
              onChange={e => setAvoidanceAnswer(e.target.value)}
              rows={3}
              autoFocus
            />
          </div>
        );

      case 4:
        return (
          <div className="onboard-step">
            <h2 className="onboard-heading">Your Personality</h2>
            <p className="onboard-label">How would you describe yourself?</p>
            <div className="choice-row">
              {['Introvert', 'Ambivert', 'Extrovert'].map(t => (
                <button key={t} className={`choice-btn ${personalityType === t ? 'choice-btn--selected' : ''}`} onClick={() => setPersonalityType(t)}>{t}</button>
              ))}
            </div>
            <p className="onboard-label" style={{ marginTop: 24 }}>When is your peak energy?</p>
            <div className="choice-row">
              {[{ key: 'Morning', icon: '🌅' }, { key: 'Afternoon', icon: '☀️' }, { key: 'Night', icon: '🌙' }].map(t => (
                <button key={t.key} className={`choice-btn ${energyPeak === t.key ? 'choice-btn--selected' : ''}`} onClick={() => setEnergyPeak(t.key)}>{t.icon} {t.key}</button>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="onboard-step">
            <h2 className="onboard-heading">What Gets You Moving?</h2>
            <p className="onboard-desc">Choose your motivation style</p>
            <div className="motivation-grid">
              {[
                { key: 'competing', label: '🏆 Competing with others', desc: 'I need to win' },
                { key: 'self_improvement', label: '📈 Beating my own records', desc: 'I compete with myself' },
                { key: 'accountability', label: '🤝 Accountability from friends', desc: 'I need someone watching' },
                { key: 'curiosity', label: '✨ Pure curiosity', desc: 'I do it for the thrill' },
              ].map(m => (
                <motion.button key={m.key} className={`motivation-card ${motivationStyle === m.key ? 'motivation-card--selected' : ''}`} onClick={() => setMotivationStyle(m.key)} whileTap={{ scale: 0.97 }}>
                  <span className="motivation-label">{m.label}</span>
                  <span className="motivation-desc">{m.desc}</span>
                </motion.button>
              ))}
            </div>
          </div>
        );

      case 6:
        return (
          <motion.div className="onboard-step character-reveal" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, type: 'spring' }}>
            <div className="character-card-reveal">
              <div className="character-glow" />
              <span className="character-class-emoji">{CLASS_DATA[selectedClass]?.emoji || '🧭'}</span>
              <h2 className="font-game character-name">{playerName || 'Adventurer'}</h2>
              <span className="badge badge--xp" style={{ fontSize: 10 }}>LEVEL 1</span>
              <div className="character-xp-bar">
                <div className="xp-bar"><div className="xp-bar__fill" style={{ width: '0%' }} /></div>
                <span className="character-xp-text font-game">0 / 500 XP</span>
              </div>
              <p className="character-class-label">{selectedClass} • {selectedGoals[0] || 'Adventurer'}</p>
              <p className="character-tagline">"{tagline}"</p>
            </div>
          </motion.div>
        );

      default: return null;
    }
  };

  return (
    <div className="onboarding-screen">
      <div className="onboard-progress">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div key={i} className={`onboard-progress-dot ${i <= step ? 'onboard-progress-dot--active' : ''}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="onboard-slide">
          {renderStep()}
        </motion.div>
      </AnimatePresence>

      <div className="onboard-nav">
        {step > 0 && step < 6 && (
          <button className="btn btn--ghost" onClick={() => setStep(step - 1)}>← Back</button>
        )}
        <button
          className={`btn ${step === 6 ? 'btn--success' : 'btn--primary'} btn--lg`}
          style={{ flex: 1, opacity: canProceed() ? 1 : 0.4 }}
          onClick={handleNext}
          disabled={!canProceed() || loading}
        >
          {loading ? '✨ Creating your character...' : step === 6 ? '⚔️ BEGIN YOUR QUEST' : step === 5 ? '✨ Reveal My Character' : 'Next →'}
        </button>
      </div>
    </div>
  );
}
