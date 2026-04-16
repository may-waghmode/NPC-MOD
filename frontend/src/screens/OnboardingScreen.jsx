import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AppIcon from '../components/AppIcon';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import './OnboardingScreen.css';

const CLASSES = [
  { id: 'Warrior', icon: 'swords', desc: 'Focus on fitness, discipline, and physical challenges.' },
  { id: 'Scholar', icon: 'book', desc: 'Focus on learning, focus, and mental growth.' },
  { id: 'Social', icon: 'users', desc: 'Focus on connections, empathy, and community.' },
  { id: 'Explorer', icon: 'global', desc: 'Focus on trying new things and breaking routines.' }
];

const QUESTIONS = [
  {
    id: 'goal',
    question: 'What is your primary objective?',
    options: ['Build better habits', 'Break an addiction/bad habit', 'Find my purpose', 'Just level up my life']
  },
  {
    id: 'challenge',
    question: 'How do you usually handle difficult tasks?',
    options: ['Procrastinate until the last minute', 'Overthink and get paralyzed', 'Dive in but lose focus', 'Avoid them entirely']
  },
  {
    id: 'distraction',
    question: 'What is your biggest time sink?',
    options: ['Mindless scrolling (Social Media/Doomscrolling)', 'Gaming / Entertainment', 'Overworking on the wrong things', 'Daydreaming / Inaction']
  },
  {
    id: 'environment',
    question: 'When do you feel most productive?',
    options: ['Early morning, before the world wakes', 'Late at night, when it\'s quiet', 'In a bustling cafe', 'When a strict deadline is looming']
  }
];

export default function OnboardingScreen() {
  const navigate = useNavigate();
  const { setIsNewUser } = useAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleOptionSelect = (option) => {
    setAnswers(prev => ({ ...prev, [QUESTIONS[step].id]: option }));
    setTimeout(() => {
      setStep(prev => prev + 1);
    }, 300);
  };

  const handleClassSelect = (classId) => {
    setSelectedClass(classId);
  };

  const handleSubmit = async () => {
    if (!selectedClass) return;
    setLoading(true);
    setError(null);
    try {
      const payload = {
        answers,
        class: selectedClass,
        goals: [answers.goal]
      };
      // For demo mode, we might not have a backend, so we try but gracefully finish
      await api.post('/player/onboarding', payload).catch(err => {
        console.warn('Backend onboarding failed (demo mode?), continuing anyway:', err);
      });
      
      setIsNewUser(false);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.');
      setLoading(false);
    }
  };

  const renderQuestion = () => {
    const q = QUESTIONS[step];
    return (
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="onboarding-step"
      >
        <p className="onboarding-step-counter font-mono">// QUESTION 0{step + 1}</p>
        <h2 className="onboarding-question">{q.question}</h2>
        <div className="onboarding-options">
          {q.options.map((opt, i) => (
            <motion.button
              key={opt}
              className={`onboarding-option-btn ${answers[q.id] === opt ? 'selected' : ''}`}
              onClick={() => handleOptionSelect(opt)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              {opt}
            </motion.button>
          ))}
        </div>
      </motion.div>
    );
  };

  const renderClassSelection = () => {
    return (
      <motion.div
        key="class-selection"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="onboarding-step"
      >
        <p className="onboarding-step-counter font-mono">// FINAL STEP</p>
        <h2 className="onboarding-question">Select Your Class</h2>
        <div className="onboarding-classes">
          {CLASSES.map((cls, i) => (
            <motion.div
              key={cls.id}
              className={`onboarding-class-card ${selectedClass === cls.id ? 'selected' : ''}`}
              onClick={() => handleClassSelect(cls.id)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="onboarding-class-icon">
                <AppIcon name={cls.icon} size={24} color={selectedClass === cls.id ? '#000' : 'var(--accent-primary)'} />
              </div>
              <div className="onboarding-class-info">
                <h3>{cls.id}</h3>
                <p>{cls.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <button
          className="btn btn-primary btn-lg onboarding-submit"
          disabled={!selectedClass || loading}
          onClick={handleSubmit}
        >
          {loading ? 'INITIALIZING...' : 'START YOUR JOURNEY'}
        </button>
        {error && <p className="onboarding-error">{error}</p>}
      </motion.div>
    );
  };

  return (
    <div className="screen onboarding-screen">
      <div className="onboarding-container">
        <AnimatePresence mode="wait">
          {step < QUESTIONS.length ? renderQuestion() : renderClassSelection()}
        </AnimatePresence>
      </div>
    </div>
  );
}
