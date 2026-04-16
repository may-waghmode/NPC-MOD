import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AppIcon from '../components/AppIcon';
import { useQuests } from '../hooks/useQuests';
import { CATEGORY_COLORS, CATEGORY_LABELS, mockQuests, mockBossBattle } from '../data/mockData';
import './QuestDetailScreen.css';

export default function QuestDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { quests, bossBattle, completeQuest } = useQuests();
  const [completed, setCompleted] = useState(false);
  const [showXPFly, setShowXPFly] = useState(false);
  const [proof, setProof] = useState(null);
  const [completionResult, setCompletionResult] = useState(null);

  // Find quest from live data, fallback to mock
  let quest;
  if (id === 'boss') {
    const boss = bossBattle || mockBossBattle;
    quest = { ...boss, category: 'boss', icon: 'skull', title: boss.name || boss.title, xpReward: boss.xpReward };
  } else {
    quest = quests.find(q => q.id === id) || mockQuests.find(q => q.id === id);
  }

  if (!quest) {
    return (
      <div className="screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>// QUEST NOT FOUND</p>
      </div>
    );
  }

  const color = CATEGORY_COLORS[quest.category] || 'var(--accent-primary)';
  const label = CATEGORY_LABELS[quest.category] || quest.category;

  const handleComplete = async () => {
    setShowXPFly(true);
    try {
      const result = await completeQuest(quest.id, proof?.name);
      setCompletionResult(result);
    } catch (err) {
      console.warn('Complete failed:', err);
    }
    setTimeout(() => { setCompleted(true); setShowXPFly(false); }, 1000);
  };

  return (
    <div className="screen quest-detail-screen">
      {/* Top bar */}
      <div className="quest-detail__topbar">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <AppIcon name="back" size={14} /> Back
        </button>
        <span className="badge" style={{ background: `${color}12`, color, border: `1px solid ${color}30`, borderRadius: 'var(--r-xs)' }}>
          {label}
        </span>
      </div>

      {/* Hero */}
      <div className="quest-detail__hero">
        <motion.div className="quest-detail__icon-wrap" animate={{ y: [0, -6, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
          <AppIcon name={quest.icon} size={48} color={color} />
        </motion.div>
        <h1 className="quest-detail__title">{quest.title}</h1>
        <div className="quest-detail__meta-row">
          <span className="badge badge-xp">+{quest.xpReward} XP</span>
          {quest.timeLeft && <span className="quest-time-left">{quest.timeLeft} remaining</span>}
        </div>
      </div>

      {/* Lore */}
      <div className="quest-detail__section">
        <div className="section-header">
          <div className="section-title-row">
            <AppIcon name="scroll" size={11} color="var(--text-dim)" />
            <span className="section-title">The Lore</span>
          </div>
        </div>
        <div className="quest-lore-card card">
          <div className="quest-lore-line" style={{ background: color }} />
          <p className="quest-lore-text">{quest.lore || quest.description}</p>
        </div>
      </div>

      {/* Proof */}
      <div className="quest-detail__section">
        <div className="section-header">
          <div className="section-title-row">
            <AppIcon name="camera" size={11} color="var(--text-dim)" />
            <span className="section-title">Proof of Deed</span>
          </div>
        </div>
        <label className="proof-upload-area card">
          <input type="file" accept="image/*" hidden onChange={e => setProof(e.target.files[0])} />
          {proof ? (
            <div className="proof-selected">
              <AppIcon name="check" size={28} color="var(--accent-success)" />
              <span className="proof-filename">{proof.name}</span>
            </div>
          ) : (
            <div className="proof-placeholder">
              <AppIcon name="camera" size={36} color="var(--text-dim)" />
              <p>Tap to upload photo / video evidence</p>
              <span className="proof-subtext">Capture your proof of completion</span>
            </div>
          )}
        </label>
      </div>

      {/* CTA */}
      <div className="quest-detail__cta">
        <AnimatePresence mode="wait">
          {!completed ? (
            <motion.div style={{ position: 'relative' }}>
              <motion.button
                className="btn btn-lg quest-complete-btn"
                style={{ background: color, color: '#000', fontWeight: 800, border: 'none' }}
                onClick={handleComplete}
                whileTap={{ scale: 0.96 }}
              >
                <AppIcon name="check" size={16} color="#000" />
                Complete Quest
              </motion.button>
              <AnimatePresence>
                {showXPFly && (
                  <motion.div className="xp-fly" initial={{ y: 0, opacity: 1 }} animate={{ y: -70, opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
                    +{quest.xpReward} XP
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div className="quest-completed-banner" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <AppIcon name="trophy" size={32} color="var(--accent-xp)" />
              <div>
                <p className="quest-completed-title">Quest Complete</p>
                <p className="quest-completed-xp">
                  +{quest.xpReward} XP earned
                  {completionResult?.leveledUp && ` — LEVEL UP to ${completionResult.newLevel}!`}
                </p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>Home</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
